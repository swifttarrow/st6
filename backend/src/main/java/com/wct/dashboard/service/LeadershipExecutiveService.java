package com.wct.dashboard.service;

import com.wct.dashboard.dto.*;
import com.wct.plan.PlanStatus;
import com.wct.plan.WeekDateUtil;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.RallyCryRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class LeadershipExecutiveService {

    private static final int TREND_WEEKS = 8;

    private final EntityManager entityManager;
    private final RallyCryRepository rallyCryRepository;

    public LeadershipExecutiveService(EntityManager entityManager, RallyCryRepository rallyCryRepository) {
        this.entityManager = entityManager;
        this.rallyCryRepository = rallyCryRepository;
    }

    public ExecutiveOverviewResponse getExecutiveOverview(LocalDate date) {
        LocalDate focusMonday = WeekDateUtil.toMonday(date);
        OrgLifecycleRollup focus = buildLifecycleRollup(focusMonday);
        List<WeekExecutionTrendRow> trend = new ArrayList<>();
        for (int i = TREND_WEEKS - 1; i >= 0; i--) {
            LocalDate w = focusMonday.minusWeeks(i);
            trend.add(buildTrendRow(w));
        }
        List<RallyCryPulseRow> mix = buildRallyCryMix(focusMonday, focus.totalCommitments());
        return new ExecutiveOverviewResponse(focusMonday, focus, trend, mix);
    }

    private OrgLifecycleRollup buildLifecycleRollup(LocalDate weekStart) {
        @SuppressWarnings("unchecked")
        List<Object[]> statusRows = entityManager.createQuery(
                        "SELECT wp.status, COUNT(wp) FROM WeeklyPlan wp WHERE wp.weekStartDate = :ws GROUP BY wp.status",
                        Object[].class)
                .setParameter("ws", weekStart)
                .getResultList();

        int draft = 0, locked = 0, reconciling = 0, reconciled = 0;
        int totalPlans = 0;
        for (Object[] row : statusRows) {
            PlanStatus st = (PlanStatus) row[0];
            int cnt = ((Long) row[1]).intValue();
            totalPlans += cnt;
            switch (st) {
                case DRAFT -> draft = cnt;
                case LOCKED -> locked = cnt;
                case RECONCILING -> reconciling = cnt;
                case RECONCILED -> reconciled = cnt;
            }
        }

        Long distinctUsers = entityManager.createQuery(
                        "SELECT COUNT(DISTINCT wp.userId) FROM WeeklyPlan wp WHERE wp.weekStartDate = :ws",
                        Long.class)
                .setParameter("ws", weekStart)
                .getSingleResult();

        Long distinctTeams = entityManager.createQuery(
                        "SELECT COUNT(DISTINCT wp.teamId) FROM WeeklyPlan wp WHERE wp.weekStartDate = :ws AND wp.teamId IS NOT NULL",
                        Long.class)
                .setParameter("ws", weekStart)
                .getSingleResult();

        Long commitments = entityManager.createQuery(
                        "SELECT COUNT(c) FROM Commitment c JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id WHERE wp.weekStartDate = :ws",
                        Long.class)
                .setParameter("ws", weekStart)
                .getSingleResult();

        return new OrgLifecycleRollup(
                totalPlans,
                draft,
                locked,
                reconciling,
                reconciled,
                distinctUsers.intValue(),
                distinctTeams.intValue(),
                commitments.intValue()
        );
    }

    private WeekExecutionTrendRow buildTrendRow(LocalDate weekStart) {
        @SuppressWarnings("unchecked")
        List<Object[]> statusRows = entityManager.createQuery(
                        "SELECT wp.status, COUNT(wp) FROM WeeklyPlan wp WHERE wp.weekStartDate = :ws GROUP BY wp.status",
                        Object[].class)
                .setParameter("ws", weekStart)
                .getResultList();

        int draft = 0, locked = 0, reconciling = 0, reconciled = 0;
        int totalPlans = 0;
        for (Object[] row : statusRows) {
            PlanStatus st = (PlanStatus) row[0];
            int cnt = ((Long) row[1]).intValue();
            totalPlans += cnt;
            switch (st) {
                case DRAFT -> draft = cnt;
                case LOCKED -> locked = cnt;
                case RECONCILING -> reconciling = cnt;
                case RECONCILED -> reconciled = cnt;
            }
        }

        Long commitments = entityManager.createQuery(
                        "SELECT COUNT(c) FROM Commitment c JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id WHERE wp.weekStartDate = :ws",
                        Long.class)
                .setParameter("ws", weekStart)
                .getSingleResult();

        return new WeekExecutionTrendRow(
                weekStart, totalPlans, draft, locked, reconciling, reconciled, commitments.intValue());
    }

    private List<RallyCryPulseRow> buildRallyCryMix(LocalDate weekStart, int orgCommitmentTotal) {
        List<RallyCry> active = rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
        if (active.isEmpty()) {
            return List.of();
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createQuery(
                        "SELECT rc.id, rc.name, COUNT(c) FROM Commitment c "
                                + "JOIN WeeklyPlan wp ON c.weeklyPlanId = wp.id "
                                + "JOIN Outcome o ON c.outcomeId = o.id "
                                + "JOIN DefiningObjective d ON o.definingObjectiveId = d.id "
                                + "JOIN RallyCry rc ON d.rallyCryId = rc.id "
                                + "WHERE wp.weekStartDate = :ws AND rc.archivedAt IS NULL "
                                + "GROUP BY rc.id, rc.name ORDER BY COUNT(c) DESC",
                        Object[].class)
                .setParameter("ws", weekStart)
                .getResultList();

        Map<UUID, Integer> countByRc = new LinkedHashMap<>();
        for (Object[] row : rows) {
            countByRc.put((UUID) row[0], ((Long) row[2]).intValue());
        }

        List<RallyCryPulseRow> result = new ArrayList<>();
        for (RallyCry rc : active) {
            int cnt = countByRc.getOrDefault(rc.getId(), 0);
            int pct = orgCommitmentTotal > 0 ? (cnt * 100) / orgCommitmentTotal : 0;
            result.add(new RallyCryPulseRow(rc.getId(), rc.getName(), cnt, pct));
        }
        result.sort(Comparator.comparingInt(RallyCryPulseRow::commitmentCount).reversed());
        return result;
    }
}
