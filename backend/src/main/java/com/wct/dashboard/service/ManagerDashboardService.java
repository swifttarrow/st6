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
            return new TeamOverviewResponse(
                    weekStart,
                    new TeamOverviewResponse.Stats(0, 0, 0, null),
                    List.of(),
                    buildRallyCryCoverage(List.of(), weekStart),
                    buildDefiningObjectiveCoverage(List.of(), weekStart)
            );
        }

        // Fetch all plans for these members for this week
        List<WeeklyPlan> plans = weeklyPlanRepository.findByUserIdInAndWeekStartDate(memberIds, weekStart);
        Map<String, WeeklyPlan> planByUser = plans.stream()
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
            if (plan == null) {
                members.add(new TeamMemberSummary(memberId, null, null, 0, null, null));
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
                    completionRate
            ));
        }

        // Rally Cry coverage
        List<RallyCryCoverage> rallyCryCoverage = buildRallyCryCoverage(memberIds, weekStart);
        List<DefiningObjectiveCoverage> definingObjectiveCoverage = buildDefiningObjectiveCoverage(memberIds, weekStart);

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

    private List<RallyCryCoverage> buildRallyCryCoverage(List<String> memberIds, LocalDate weekStart) {
        List<RallyCry> activeRCs = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
        if (activeRCs.isEmpty()) return List.of();

        // For the current week, get commitment counts and member counts per RC
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

        List<RallyCryCoverage> result = new ArrayList<>();
        for (RallyCry rc : activeRCs) {
            int commitmentCount = commitmentCountByRC.getOrDefault(rc.getId(), 0);
            int memberCount = memberCountByRC.getOrDefault(rc.getId(), 0);
            int consecutiveZeroWeeks = computeConsecutiveZeroWeeks(rc.getId(), memberIds, weekStart);

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

    private int computeConsecutiveZeroWeeks(UUID rallyCryId, List<String> memberIds, LocalDate weekStart) {
        if (memberIds == null || memberIds.isEmpty()) return 0;

        int count = 0;
        for (int i = 1; i <= 10; i++) {
            LocalDate priorWeek = weekStart.minusWeeks(i);
            Long commitments = entityManager.createQuery(
                    "SELECT COUNT(c) FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "WHERE d.rallyCryId = :rcId " +
                    "AND wp.userId IN :memberIds " +
                    "AND wp.weekStartDate = :weekStart",
                    Long.class
            ).setParameter("rcId", rallyCryId)
             .setParameter("memberIds", memberIds)
             .setParameter("weekStart", priorWeek)
             .getSingleResult();

            if (commitments == 0) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    private List<DefiningObjectiveCoverage> buildDefiningObjectiveCoverage(List<String> memberIds, LocalDate weekStart) {
        List<RallyCry> activeRCs = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
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

        List<DefiningObjectiveCoverage> result = new ArrayList<>();
        for (RallyCry rc : activeRCs) {
            List<DefiningObjective> dos = definingObjectiveRepository
                    .findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(rc.getId());
            for (DefiningObjective d : dos) {
                int commitmentCount = commitmentCountByDO.getOrDefault(d.getId(), 0);
                int memberCount = memberCountByDO.getOrDefault(d.getId(), 0);
                int consecutiveZeroWeeks = computeConsecutiveZeroWeeksForDO(d.getId(), memberIds, weekStart);
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
        }
        return result;
    }

    private int computeConsecutiveZeroWeeksForDO(UUID definingObjectiveId, List<String> memberIds, LocalDate weekStart) {
        if (memberIds == null || memberIds.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (int i = 1; i <= 10; i++) {
            LocalDate priorWeek = weekStart.minusWeeks(i);
            Long commitments = entityManager.createQuery(
                    "SELECT COUNT(c) FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "WHERE o.definingObjectiveId = :doId " +
                    "AND wp.userId IN :memberIds " +
                    "AND wp.weekStartDate = :weekStart",
                    Long.class
            ).setParameter("doId", definingObjectiveId)
                    .setParameter("memberIds", memberIds)
                    .setParameter("weekStart", priorWeek)
                    .getSingleResult();

            if (commitments == 0) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }
}
