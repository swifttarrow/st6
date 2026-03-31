package com.wct.dashboard.service;

import com.wct.dashboard.dto.OrgOverviewResponse;
import com.wct.dashboard.dto.RcdoHierarchyCoverage;
import com.wct.plan.WeekDateUtil;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeadershipOverviewService {

    private final RallyCryRepository rallyCryRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final EntityManager entityManager;

    public LeadershipOverviewService(RallyCryRepository rallyCryRepository,
                                      DefiningObjectiveRepository definingObjectiveRepository,
                                      EntityManager entityManager) {
        this.rallyCryRepository = rallyCryRepository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.entityManager = entityManager;
    }

    public OrgOverviewResponse getOrgOverview(LocalDate date) {
        LocalDate weekStart = WeekDateUtil.toMonday(date);

        List<RallyCry> activeRCs = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();

        // totalTeams: distinct team_ids from weekly_plan for this week
        int totalTeams = ((Long) entityManager.createQuery(
                "SELECT COUNT(DISTINCT wp.teamId) FROM WeeklyPlan wp " +
                "WHERE wp.weekStartDate = :weekStart AND wp.teamId IS NOT NULL"
        ).setParameter("weekStart", weekStart).getSingleResult()).intValue();

        int activeRallyCries = activeRCs.size();

        // orgCommitments: total commitments across ALL plans for the week
        int orgCommitments = ((Long) entityManager.createQuery(
                "SELECT COUNT(c) FROM Commitment c " +
                "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                "WHERE wp.weekStartDate = :weekStart"
        ).setParameter("weekStart", weekStart).getSingleResult()).intValue();

        // RC-level coverage: teamCount and commitmentCount per RC
        Map<UUID, int[]> rcCoverage = new HashMap<>();
        if (!activeRCs.isEmpty()) {
            List<Object[]> rcResults = entityManager.createQuery(
                    "SELECT rc.id, COUNT(DISTINCT wp.teamId), COUNT(c) " +
                    "FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "JOIN RallyCry rc ON d.rallyCryId = rc.id " +
                    "WHERE wp.weekStartDate = :weekStart AND wp.teamId IS NOT NULL " +
                    "AND rc.archivedAt IS NULL " +
                    "GROUP BY rc.id",
                    Object[].class
            ).setParameter("weekStart", weekStart).getResultList();

            for (Object[] row : rcResults) {
                UUID rcId = (UUID) row[0];
                int teamCount = ((Long) row[1]).intValue();
                int commitmentCount = ((Long) row[2]).intValue();
                rcCoverage.put(rcId, new int[]{teamCount, commitmentCount});
            }
        }

        // DO-level coverage: teamCount and commitmentCount per DO
        Map<UUID, int[]> doCoverage = new HashMap<>();
        if (!activeRCs.isEmpty()) {
            List<Object[]> doResults = entityManager.createQuery(
                    "SELECT d.id, COUNT(DISTINCT wp.teamId), COUNT(c) " +
                    "FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "WHERE wp.weekStartDate = :weekStart AND wp.teamId IS NOT NULL " +
                    "AND d.archivedAt IS NULL " +
                    "GROUP BY d.id",
                    Object[].class
            ).setParameter("weekStart", weekStart).getResultList();

            for (Object[] row : doResults) {
                UUID doId = (UUID) row[0];
                int teamCount = ((Long) row[1]).intValue();
                int commitmentCount = ((Long) row[2]).intValue();
                doCoverage.put(doId, new int[]{teamCount, commitmentCount});
            }
        }

        // coverageGaps: RCs with 0 commitments
        int coverageGaps = 0;
        for (RallyCry rc : activeRCs) {
            int[] coverage = rcCoverage.get(rc.getId());
            if (coverage == null || coverage[1] == 0) {
                coverageGaps++;
            }
        }

        // Build hierarchy
        List<RcdoHierarchyCoverage> hierarchy = new ArrayList<>();
        for (RallyCry rc : activeRCs) {
            int[] coverage = rcCoverage.getOrDefault(rc.getId(), new int[]{0, 0});
            int rcTeamCount = coverage[0];
            int rcCommitmentCount = coverage[1];
            int coveragePercent = totalTeams > 0 ? (rcTeamCount * 100) / totalTeams : 0;
            String status = computeStatus(coveragePercent);
            int consecutiveZeroWeeks = computeConsecutiveZeroWeeksForRC(rc.getId(), weekStart);
            String warningNote = consecutiveZeroWeeks >= 3
                    ? "Zero commitments for " + consecutiveZeroWeeks + " consecutive weeks."
                    : null;

            // Children: DOs under this RC
            List<DefiningObjective> activeDOs = definingObjectiveRepository
                    .findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(rc.getId());
            List<RcdoHierarchyCoverage> children = new ArrayList<>();
            for (DefiningObjective doEntity : activeDOs) {
                int[] doCov = doCoverage.getOrDefault(doEntity.getId(), new int[]{0, 0});
                int doTeamCount = doCov[0];
                int doCommitmentCount = doCov[1];
                int doCoveragePercent = totalTeams > 0 ? (doTeamCount * 100) / totalTeams : 0;
                String doStatus = computeStatus(doCoveragePercent);

                children.add(new RcdoHierarchyCoverage(
                        "DEFINING_OBJECTIVE",
                        doEntity.getId(),
                        doEntity.getName(),
                        doTeamCount,
                        totalTeams,
                        doCommitmentCount,
                        doCoveragePercent,
                        doStatus,
                        null,
                        null,
                        null
                ));
            }

            hierarchy.add(new RcdoHierarchyCoverage(
                    "RALLY_CRY",
                    rc.getId(),
                    rc.getName(),
                    rcTeamCount,
                    totalTeams,
                    rcCommitmentCount,
                    coveragePercent,
                    status,
                    consecutiveZeroWeeks,
                    warningNote,
                    children
            ));
        }

        return new OrgOverviewResponse(
                weekStart,
                new OrgOverviewResponse.Stats(totalTeams, activeRallyCries, orgCommitments, coverageGaps),
                hierarchy
        );
    }

    private String computeStatus(int coveragePercent) {
        if (coveragePercent >= 50) return "ON_TRACK";
        if (coveragePercent > 0) return "AT_RISK";
        return "ALERT";
    }

    private int computeConsecutiveZeroWeeksForRC(UUID rallyCryId, LocalDate weekStart) {
        int count = 0;
        for (int i = 1; i <= 10; i++) {
            LocalDate priorWeek = weekStart.minusWeeks(i);
            Long commitments = entityManager.createQuery(
                    "SELECT COUNT(c) FROM Commitment c " +
                    "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id " +
                    "JOIN Outcome o ON c.outcomeId = o.id " +
                    "JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
                    "WHERE d.rallyCryId = :rcId " +
                    "AND wp.weekStartDate = :weekStart",
                    Long.class
            ).setParameter("rcId", rallyCryId)
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
