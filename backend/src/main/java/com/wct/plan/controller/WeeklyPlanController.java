package com.wct.plan.controller;

import com.wct.auth.UserContext;
import com.wct.auth.UserContextHolder;
import com.wct.plan.PlanStatus;
import com.wct.plan.dto.MyPlanSummaryResponse;
import com.wct.plan.dto.PlanTransitionRequest;
import com.wct.plan.dto.PlanTransitionResponse;
import com.wct.plan.dto.WeeklyPlanResponse;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.service.ArchivedOutcomeException;
import com.wct.plan.service.IncompleteReconciliationException;
import com.wct.plan.service.InvalidTransitionException;
import com.wct.plan.service.WeeklyPlanService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
public class WeeklyPlanController {

    private final WeeklyPlanService weeklyPlanService;

    public WeeklyPlanController(WeeklyPlanService weeklyPlanService) {
        this.weeklyPlanService = weeklyPlanService;
    }

    @GetMapping
    public ResponseEntity<WeeklyPlanResponse> getOrCreatePlan(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        UserContext user = UserContextHolder.get();
        WeeklyPlan plan = weeklyPlanService.getOrCreatePlan(user.userId(), date, user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    /**
     * Lists existing weekly plans for the current user in a date range (no auto-create).
     */
    @GetMapping("/me")
    public ResponseEntity<List<MyPlanSummaryResponse>> listMyPlans(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        UserContext user = UserContextHolder.get();
        return ResponseEntity.ok(weeklyPlanService.listMyPlanSummaries(user.userId(), from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyPlanResponse> getPlanById(@PathVariable UUID id) {
        UserContext user = UserContextHolder.get();
        WeeklyPlan plan = weeklyPlanService.getPlanWithAuthCheck(id, user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<?> transitionPlan(@PathVariable UUID id,
                                            @RequestBody PlanTransitionRequest request) {
        UserContext user = UserContextHolder.get();
        PlanStatus targetStatus;
        try {
            targetStatus = PlanStatus.valueOf(request.targetStatus());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_STATUS",
                    "message", "Unknown status: " + request.targetStatus()
            ));
        }

        try {
            WeeklyPlan plan = weeklyPlanService.transitionPlan(id, targetStatus, user);
            return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
        } catch (ArchivedOutcomeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "ARCHIVED_OUTCOME_REFERENCES",
                    "message", e.getMessage(),
                    "commitmentIds", e.getCommitmentIds()
            ));
        } catch (IncompleteReconciliationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "INCOMPLETE_RECONCILIATION",
                    "message", e.getMessage(),
                    "unannotatedCommitmentIds", e.getUnannotatedCommitmentIds()
            ));
        } catch (InvalidTransitionException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "INVALID_TRANSITION",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<?> unlockPlan(@PathVariable UUID id) {
        UserContext user = UserContextHolder.get();
        try {
            WeeklyPlan plan = weeklyPlanService.unlockPlan(id, user);
            return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
        } catch (InvalidTransitionException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "INVALID_TRANSITION",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/transitions")
    public ResponseEntity<List<PlanTransitionResponse>> getTransitions(@PathVariable UUID id) {
        return ResponseEntity.ok(
                weeklyPlanService.getTransitions(id).stream()
                        .map(PlanTransitionResponse::from)
                        .toList()
        );
    }
}
