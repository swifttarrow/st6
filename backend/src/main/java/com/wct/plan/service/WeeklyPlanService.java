package com.wct.plan.service;

import com.wct.auth.Role;
import com.wct.auth.UserContext;
import com.wct.commitment.entity.Commitment;
import com.wct.commitment.repository.CommitmentRepository;
import com.wct.commitment.service.CarryForwardService;
import com.wct.plan.PlanStatus;
import com.wct.plan.WeekDateUtil;
import com.wct.plan.dto.MyPlanSummaryResponse;
import com.wct.plan.entity.PlanStateTransition;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.repository.PlanStateTransitionRepository;
import com.wct.plan.repository.WeeklyPlanRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class WeeklyPlanService {

    private final WeeklyPlanRepository weeklyPlanRepository;
    private final PlanStateTransitionRepository transitionRepository;
    private final CommitmentRepository commitmentRepository;
    private final CarryForwardService carryForwardService;

    public WeeklyPlanService(WeeklyPlanRepository weeklyPlanRepository,
                             PlanStateTransitionRepository transitionRepository,
                             CommitmentRepository commitmentRepository,
                             CarryForwardService carryForwardService) {
        this.weeklyPlanRepository = weeklyPlanRepository;
        this.transitionRepository = transitionRepository;
        this.commitmentRepository = commitmentRepository;
        this.carryForwardService = carryForwardService;
    }

    @Transactional
    public WeeklyPlan getOrCreatePlan(String userId, LocalDate date, UserContext user) {
        LocalDate monday = WeekDateUtil.toMonday(date);
        var existing = weeklyPlanRepository.findByUserIdAndWeekStartDate(userId, monday);
        if (existing.isPresent()) {
            return existing.get();
        }
        WeeklyPlan plan = new WeeklyPlan();
        plan.setUserId(userId);
        plan.setWeekStartDate(monday);
        plan.setTeamId(user.teamId());
        plan.setStatus(PlanStatus.DRAFT);
        try {
            plan = weeklyPlanRepository.saveAndFlush(plan);
        } catch (DataIntegrityViolationException ex) {
            return weeklyPlanRepository.findByUserIdAndWeekStartDate(userId, monday)
                    .orElseThrow(() -> ex);
        }
        carryForwardService.carryForward(plan);
        return plan;
    }

    public WeeklyPlan getExistingPlan(String userId, LocalDate date) {
        LocalDate monday = WeekDateUtil.toMonday(date);
        return weeklyPlanRepository.findByUserIdAndWeekStartDate(userId, monday)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found"));
    }

    public WeeklyPlan getPlanById(UUID planId) {
        return weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found"));
    }

    public WeeklyPlan getPlanByIdForUpdate(UUID planId) {
        return weeklyPlanRepository.findByIdForUpdate(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan not found"));
    }

    public WeeklyPlan getPlanWithAuthCheck(UUID planId, UserContext user) {
        WeeklyPlan plan = getPlanById(planId);
        verifyPlanAccess(plan, user);
        return plan;
    }

    @Transactional
    public WeeklyPlan transitionPlan(UUID planId, PlanStatus targetStatus, UserContext user) {
        WeeklyPlan plan = getPlanById(planId);

        // Only the plan owner can transition
        if (!plan.getUserId().equals(user.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the plan owner can transition the plan");
        }

        if (!plan.getStatus().canTransitionTo(targetStatus)) {
            throw new InvalidTransitionException(plan.getStatus(), targetStatus);
        }

        // Archived outcome check for DRAFT -> LOCKED
        if (targetStatus == PlanStatus.LOCKED) {
            List<UUID> archivedCommitmentIds = commitmentRepository.findArchivedCommitmentIdsByWeeklyPlanId(planId);
            if (!archivedCommitmentIds.isEmpty()) {
                throw new ArchivedOutcomeException(archivedCommitmentIds);
            }
        }

        // Completeness check for RECONCILING -> RECONCILED
        if (targetStatus == PlanStatus.RECONCILED) {
            long totalCommitments = commitmentRepository.countByWeeklyPlanId(planId);
            if (totalCommitments > 0) {
                List<Commitment> unannotated = commitmentRepository.findByWeeklyPlanIdAndActualStatusIsNull(planId);
                if (!unannotated.isEmpty()) {
                    List<UUID> ids = unannotated.stream().map(Commitment::getId).toList();
                    throw new IncompleteReconciliationException(ids);
                }
            }
        }

        PlanStatus fromStatus = plan.getStatus();
        plan.setStatus(targetStatus);
        plan = weeklyPlanRepository.save(plan);

        PlanStateTransition transition = new PlanStateTransition();
        transition.setWeeklyPlanId(plan.getId());
        transition.setFromStatus(fromStatus.name());
        transition.setToStatus(targetStatus.name());
        transition.setTriggeredBy(user.userId());
        transitionRepository.save(transition);

        return plan;
    }

    @Transactional
    public WeeklyPlan unlockPlan(UUID planId, UserContext managerContext) {
        // Unlock is restricted to managers.
        if (managerContext.role() != Role.MANAGER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can unlock plans");
        }

        // Load plan
        WeeklyPlan plan = getPlanById(planId);
        verifyPlanAccess(plan, managerContext);

        // Verify plan is LOCKED
        if (plan.getStatus() != PlanStatus.LOCKED) {
            throw new InvalidTransitionException("Plan can only be unlocked from LOCKED state");
        }

        // Set status to DRAFT
        PlanStatus fromStatus = plan.getStatus();
        plan.setStatus(PlanStatus.DRAFT);
        plan = weeklyPlanRepository.save(plan);

        // Log transition
        PlanStateTransition transition = new PlanStateTransition();
        transition.setWeeklyPlanId(plan.getId());
        transition.setFromStatus(fromStatus.name());
        transition.setToStatus(PlanStatus.DRAFT.name());
        transition.setTriggeredBy(managerContext.userId());
        transitionRepository.save(transition);

        return plan;
    }

    public List<PlanStateTransition> getTransitions(UUID planId) {
        return transitionRepository.findByWeeklyPlanIdOrderByTransitionedAt(planId);
    }

    /**
     * Lists existing plans for the user in the date range (inclusive, normalized to Mondays).
     * Does not create plans.
     */
    public List<MyPlanSummaryResponse> listMyPlanSummaries(String userId, LocalDate from, LocalDate to) {
        LocalDate mondayFrom = WeekDateUtil.toMonday(from);
        LocalDate mondayTo = WeekDateUtil.toMonday(to);
        if (mondayFrom.isAfter(mondayTo)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "`from` must be on or before `to`");
        }
        long weeksBetween = java.time.temporal.ChronoUnit.WEEKS.between(mondayFrom, mondayTo);
        if (weeksBetween > 104) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Date range cannot exceed 104 weeks");
        }
        List<WeeklyPlan> plans = weeklyPlanRepository
                .findByUserIdAndWeekStartDateBetweenOrderByWeekStartDateDesc(userId, mondayFrom, mondayTo);
        List<MyPlanSummaryResponse> out = new ArrayList<>();
        for (WeeklyPlan wp : plans) {
            long cc = commitmentRepository.countByWeeklyPlanId(wp.getId());
            out.add(new MyPlanSummaryResponse(
                    wp.getId(), wp.getWeekStartDate(), wp.getStatus().name(), cc));
        }
        return out;
    }

    private void verifyPlanAccess(WeeklyPlan plan, UserContext user) {
        if (user.role() == Role.LEADERSHIP) {
            return;
        }

        if (user.role() == Role.MANAGER) {
            if (!user.directReportIds().isEmpty()) {
                if (user.directReportIds().contains(plan.getUserId())) {
                    return;
                }
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
            }

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Manager access requires direct-report scope in the auth token"
            );
        }

        if (!plan.getUserId().equals(user.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }
}
