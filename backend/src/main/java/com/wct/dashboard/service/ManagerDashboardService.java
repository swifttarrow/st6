package com.wct.dashboard.service;

import com.wct.commitment.ActualStatus;
import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.dashboard.dto.DefiningObjectiveCoverage;
import com.wct.dashboard.dto.RallyCryCoverage;
import com.wct.dashboard.dto.TeamMemberSummary;
import com.wct.dashboard.dto.TeamOverviewResponse;
import com.wct.plan.PlanStatus;
import com.wct.plan.WeekDateUtil;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.repository.WeeklyPlanRepository;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ManagerDashboardService {

    private final WeeklyPlanRepository weeklyPlanRepository;
    private final CommitmentRepository commitmentRepository;
    private final RallyCryRepository rallyCryRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final EntityManager entityManager;

    public ManagerDashboardService(WeeklyPlanRepository weeklyPlanRepository,
                                   CommitmentRepository commitmentRepository,
                                   RallyCryRepository rallyCryRepository,
                                   DefiningObjectiveRepository definingObjectiveRepository,
                                   EntityManager entityManager) {
        this.weeklyPlanRepository = weeklyPlanRepository;
        this.commitmentRepository = commitmentRepository;
        this.rallyCryRepository = rallyCryRepository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.entityManager = entityManager;
    }

    public TeamOverviewResponse getTeamOverview(List<String> memberIds, LocalDate date) {
        LocalDate weekStart = WeekDateUtil.toMonday(date);

        if (memberIds == null || memberIds.isEmpty()) {
            List<RallyCry> emptyRCs = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
            return new TeamOverviewResponse(
                    weekStart,
                    new TeamOverviewResponse.Stats(0, 0, 0, null),
                    List.of(),
                    buildRallyCryCoverage(emptyRCs, List.of(), weekStart),
                    buildDefiningObjectiveCoverage(emptyRCs, List.of(), weekStart)
            );
        }

        // Fetch all plans for these members for this week
        List<WeeklyPlan> plans = weeklyPlanRepository.findByUserIdInAndWeekStartDate(memberIds, weekStart);
        Map<String, WeeklyPlan> planByUser = plans.stream()
                .collect(Collectors.toMap(WeeklyPlan::getUserId, p -> p));
        LocalDate priorWeekStart = weekStart.minusWeeks(1);
        Map<String, WeeklyPlan> priorPlanByUser = weeklyPlanRepository
                .findByUserIdInAndWeekStartDate(memberIds, priorWeekStart)
                .stream()
                .collect(Collectors.toMap(WeeklyPlan::getUserId, p -> p));

        // Fetch all commitments for these plans in one query
        List<UUID> planIds = plans.stream().map(WeeklyPlan::getId).toList();
        Map<UUID, List<Commitment>> commitmentsByPlan = new HashMap<>();
        if (!planIds.isEmpty()) {
            List<Commitment> allCommitments = findCommitmentsByPlanIds(planIds);
            for (Commitment c : allCommitments) {
                commitmentsByPlan.computeIfAbsent(c.getWeeklyPlanId(), k -> new ArrayList<>()).add(c);
            }
        }

        // Stats
        Set<PlanStatus> lockedStatuses = Set.of(PlanStatus.LOCKED, PlanStatus.RECONCILING, PlanStatus.RECONCILED);
        int plansLocked = (int) plans.stream()
                .filter(p -> lockedStatuses.contains(p.getStatus()))
                .count();

        int totalCommitments = commitmentsByPlan.values().stream()
                .mapToInt(List::size)
                .sum();

        Double avgCompletionRate = computeAvgCompletionRate(plans, commitmentsByPlan);

        // Fetch top Rally Cry per plan (batch)
        Map<UUID, String> topRallyCryByPlan = new HashMap<>();
        if (!planIds.isEmpty()) {
            topRallyCryByPlan = findTopRallyCryByPlanIds(planIds);
        }

        // Build member summaries
        List<TeamMemberSummary> members = new ArrayList<>();
        for (String memberId : memberIds) {
            WeeklyPlan plan = planByUser.get(memberId);
            WeeklyPlan priorPlan = priorPlanByUser.get(memberId);
            LocalDate priorWeekAttentionDate =
                    priorPlan != null && priorPlan.getStatus() != PlanStatus.RECONCILED
                            ? priorPlan.getWeekStartDate()
                            : null;
            String priorWeekAttentionStatus =
                    priorPlan != null && priorPlan.getStatus() != PlanStatus.RECONCILED
                            ? priorPlan.getStatus().name()
                            : null;
            if (plan == null) {
                members.add(new TeamMemberSummary(
                        memberId,
                        null,
                        null,
                        0,
                        null,
                        null,
                        priorWeekAttentionDate,
                        priorWeekAttentionStatus
                ));
                continue;
            }

            List<Commitment> planCommitments = commitmentsByPlan.getOrDefault(plan.getId(), List.of());
            int commitmentCount = planCommitments.size();
            String topRallyCry = topRallyCryByPlan.get(plan.getId());

            Double completionRate = null;
            if (plan.getStatus() == PlanStatus.RECONCILED && !planCommitments.isEmpty()) {
                long completed = planCommitments.stream()
                        .filter(c -> c.getActualStatus() == ActualStatus.COMPLETED)
                        .count();
                completionRate = (double) completed / planCommitments.size();
            }

            members.add(new TeamMemberSummary(
                    memberId,
                    plan.getId(),
                    plan.getStatus().name(),
                    commitmentCount,
                    topRallyCry,
                    completionRate,
                    priorWeekAttentionDate,
                    priorWeekAttentionStatus
            ));
        }

        // Rally Cry & Defining Objective coverage (share the RC list to avoid duplicate fetch)
        List<RallyCry> activeRCs = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
        List<RallyCryCoverage> rallyCryCoverage = buildRallyCryCoverage(activeRCs, memberIds, weekStart);
        List<DefiningObjectiveCoverage> definingObjectiveCoverage = buildDefiningObjectiveCoverage(activeRCs, memberIds, weekStart);

        return new TeamOverviewResponse(
                weekStart,
                new TeamOverviewResponse.Stats(memberIds.size(), plansLocked, totalCommitments, avgCompletionRate),
                members,
                rallyCryCoverage,
                definingObjectiveCoverage
        );
    }

    private List<Commitment> findCommitmentsByPlanIds(List<UUID> planIds) {
        TypedQuery<Commitment> query = entityManager.createQuery(
                "SELECT c FROM Commitment c WHERE c.weeklyPlanId IN :planIds ORDER BY c.weeklyPlanId, c.priority",
                Commitment.class
        );
        query.setParameter("planIds", planIds);
        return query.getResultList();
    }

    private Map<UUID, String> findTopRallyCryByPlanIds(List<UUID> planIds) {
        // For each plan, find the Rally Cry with the most commitments
        List<Object[]> results = entityManager.createQuery(
                "SELECT c.weeklyPlanId, rc.name, COUNT(c) as cnt " +
                "FROM Commitment c " +
                "JOIN Outcome o ON c.outcomeId = o.id " +
                "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                "JOIN RallyCry rc ON d.rallyCryId = rc.id " +
                "WHERE c.weeklyPlanId IN :planIds " +
                "GROUP BY c.weeklyPlanId, rc.id, rc.name " +
                "ORDER BY c.weeklyPlanId, cnt DESC",
                Object[].class
        ).setParameter("planIds", planIds).getResultList();

        Map<UUID, String> topByPlan = new LinkedHashMap<>();
        for (Object[] row : results) {
            UUID planId = (UUID) row[0];
            String rcName = (String) row[1];
            topByPlan.putIfAbsent(planId, rcName);
        }
        return topByPlan;
    }

    private Double computeAvgCompletionRate(List<WeeklyPlan> plans, Map<UUID, List<Commitment>> commitmentsByPlan) {
        List<Double> rates = new ArrayList<>();
        for (WeeklyPlan plan : plans) {
            if (plan.getStatus() != PlanStatus.RECONCILED) continue;
            List<Commitment> commitments = commitmentsByPlan.getOrDefault(plan.getId(), List.of());
            if (commitments.isEmpty()) continue;
            long completed = commitments.stream()
                    .filter(c -> c.getActualStatus() == ActualStatus.COMPLETED)
                    .count();
            rates.add((double) completed / commitments.size());
        }
        if (rates.isEmpty()) return null;
        return rates.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private List<RallyCryCoverage> buildRallyCryCoverage(List<RallyCry> activeRCs, List<String> memberIds, LocalDate weekStart) {
        if (activeRCs.isEmpty()) return List.of();

        Map<UUID, Integer> commitmentCountByRC = new HashMap<>();
        Map<UUID, Integer> memberCountByRC = new HashMap<>();

        if (!memberIds.isEmpty()) {
            List<Object[]> coverageResults = entityManager.createQuery(
                    "SELECT rc.id, COUNT(c), COUNT(DISTINCT wp.userId) " +
                    "FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "JOIN RallyCry rc ON d.rallyCryId = rc.id " +
                    "WHERE wp.userId IN :memberIds AND wp.weekStartDate = :weekStart " +
                    "GROUP BY rc.id",
                    Object[].class
            ).setParameter("memberIds", memberIds)
             .setParameter("weekStart", weekStart)
             .getResultList();

            for (Object[] row : coverageResults) {
                UUID rcId = (UUID) row[0];
                commitmentCountByRC.put(rcId, ((Long) row[1]).intValue());
                memberCountByRC.put(rcId, ((Long) row[2]).intValue());
            }
        }

        List<UUID> rcIds = activeRCs.stream().map(RallyCry::getId).toList();
        Map<UUID, Integer> consecutiveZeroByRC = batchConsecutiveZeroWeeksForRCs(rcIds, memberIds, weekStart);

        List<RallyCryCoverage> result = new ArrayList<>();
        for (RallyCry rc : activeRCs) {
            int commitmentCount = commitmentCountByRC.getOrDefault(rc.getId(), 0);
            int memberCount = memberCountByRC.getOrDefault(rc.getId(), 0);
            int consecutiveZeroWeeks = consecutiveZeroByRC.getOrDefault(rc.getId(), 0);

            result.add(new RallyCryCoverage(
                    rc.getId(),
                    rc.getName(),
                    commitmentCount,
                    memberCount,
                    consecutiveZeroWeeks
            ));
        }
        return result;
    }

    /**
     * Batch query: for each RC, count commitments per prior week (up to 10 weeks back),
     * then compute consecutive zero-weeks in Java instead of N+1 individual queries.
     */
    private Map<UUID, Integer> batchConsecutiveZeroWeeksForRCs(List<UUID> rcIds, List<String> memberIds, LocalDate weekStart) {
        if (memberIds == null || memberIds.isEmpty() || rcIds.isEmpty()) return Map.of();

        List<LocalDate> priorWeeks = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            priorWeeks.add(weekStart.minusWeeks(i));
        }

        // Single query: get (rcId, weekStartDate) pairs that have commitments
        List<Object[]> rows = entityManager.createQuery(
                "SELECT d.rallyCryId, wp.weekStartDate " +
                "FROM Commitment c " +
                "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                "JOIN Outcome o ON c.outcomeId = o.id " +
                "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                "WHERE d.rallyCryId IN :rcIds " +
                "AND wp.userId IN :memberIds " +
                "AND wp.weekStartDate IN :weeks " +
                "GROUP BY d.rallyCryId, wp.weekStartDate",
                Object[].class
        ).setParameter("rcIds", rcIds)
         .setParameter("memberIds", memberIds)
         .setParameter("weeks", priorWeeks)
         .getResultList();

        // Build set of (rcId, weekStart) pairs that have > 0 commitments
        Set<String> nonZeroPairs = new HashSet<>();
        for (Object[] row : rows) {
            UUID rcId = (UUID) row[0];
            LocalDate week = (LocalDate) row[1];
            nonZeroPairs.add(rcId + "|" + week);
        }

        // Compute consecutive zero weeks per RC
        Map<UUID, Integer> result = new HashMap<>();
        for (UUID rcId : rcIds) {
            int count = 0;
            for (LocalDate pw : priorWeeks) {
                if (nonZeroPairs.contains(rcId + "|" + pw)) {
                    break;
                }
                count++;
            }
            result.put(rcId, count);
        }
        return result;
    }

    private List<DefiningObjectiveCoverage> buildDefiningObjectiveCoverage(List<RallyCry> activeRCs, List<String> memberIds, LocalDate weekStart) {
        if (activeRCs.isEmpty()) {
            return List.of();
        }

        Map<UUID, Integer> commitmentCountByDO = new HashMap<>();
        Map<UUID, Integer> memberCountByDO = new HashMap<>();

        if (!memberIds.isEmpty()) {
            List<Object[]> coverageResults = entityManager.createQuery(
                    "SELECT d.id, COUNT(c), COUNT(DISTINCT wp.userId) " +
                    "FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "WHERE wp.userId IN :memberIds AND wp.weekStartDate = :weekStart " +
                    "AND d.archivedAt IS NULL " +
                    "GROUP BY d.id",
                    Object[].class
            ).setParameter("memberIds", memberIds)
                    .setParameter("weekStart", weekStart)
                    .getResultList();

            for (Object[] row : coverageResults) {
                UUID doId = (UUID) row[0];
                commitmentCountByDO.put(doId, ((Long) row[1]).intValue());
                memberCountByDO.put(doId, ((Long) row[2]).intValue());
            }
        }

        // Collect all DO IDs first, then batch the consecutive-zero-weeks query
        List<DefiningObjective> allDOs = new ArrayList<>();
        Map<UUID, RallyCry> rcByDoId = new HashMap<>();
        for (RallyCry rc : activeRCs) {
            List<DefiningObjective> dos = definingObjectiveRepository
                    .findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(rc.getId());
            for (DefiningObjective d : dos) {
                allDOs.add(d);
                rcByDoId.put(d.getId(), rc);
            }
        }

        List<UUID> doIds = allDOs.stream().map(DefiningObjective::getId).toList();
        Map<UUID, Integer> consecutiveZeroByDO = batchConsecutiveZeroWeeksForDOs(doIds, memberIds, weekStart);

        List<DefiningObjectiveCoverage> result = new ArrayList<>();
        for (DefiningObjective d : allDOs) {
            RallyCry rc = rcByDoId.get(d.getId());
            int commitmentCount = commitmentCountByDO.getOrDefault(d.getId(), 0);
            int memberCount = memberCountByDO.getOrDefault(d.getId(), 0);
            int consecutiveZeroWeeks = consecutiveZeroByDO.getOrDefault(d.getId(), 0);
            result.add(new DefiningObjectiveCoverage(
                    d.getId(),
                    d.getName(),
                    rc.getId(),
                    rc.getName(),
                    commitmentCount,
                    memberCount,
                    consecutiveZeroWeeks
            ));
        }
        return result;
    }

    private Map<UUID, Integer> batchConsecutiveZeroWeeksForDOs(List<UUID> doIds, List<String> memberIds, LocalDate weekStart) {
        if (memberIds == null || memberIds.isEmpty() || doIds.isEmpty()) return Map.of();

        List<LocalDate> priorWeeks = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            priorWeeks.add(weekStart.minusWeeks(i));
        }

        List<Object[]> rows = entityManager.createQuery(
                "SELECT o.definingObjectiveId, wp.weekStartDate " +
                "FROM Commitment c " +
                "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                "JOIN Outcome o ON c.outcomeId = o.id " +
                "WHERE o.definingObjectiveId IN :doIds " +
                "AND wp.userId IN :memberIds " +
                "AND wp.weekStartDate IN :weeks " +
                "GROUP BY o.definingObjectiveId, wp.weekStartDate",
                Object[].class
        ).setParameter("doIds", doIds)
         .setParameter("memberIds", memberIds)
         .setParameter("weeks", priorWeeks)
         .getResultList();

        Set<String> nonZeroPairs = new HashSet<>();
        for (Object[] row : rows) {
            UUID doId = (UUID) row[0];
            LocalDate week = (LocalDate) row[1];
            nonZeroPairs.add(doId + "|" + week);
        }

        Map<UUID, Integer> result = new HashMap<>();
        for (UUID doId : doIds) {
            int count = 0;
            for (LocalDate pw : priorWeeks) {
                if (nonZeroPairs.contains(doId + "|" + pw)) {
                    break;
                }
                count++;
            }
            result.put(doId, count);
        }
        return result;
    }
}
