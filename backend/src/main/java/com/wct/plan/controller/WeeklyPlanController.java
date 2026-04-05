package com.wct.plan.controller;

import com.wct.auth.CurrentUser;
import com.wct.auth.UserContext;
import com.wct.plan.dto.MyPlanSummaryResponse;
import com.wct.plan.dto.PlanTransitionRequest;
import com.wct.plan.dto.PlanTransitionResponse;
import com.wct.plan.dto.WeeklyPlanResponse;
import com.wct.plan.entity.WeeklyPlan;
import com.wct.plan.service.WeeklyPlanService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @CurrentUser UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getOrCreatePlan(user.userId(), date, user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    /**
     * Lists existing weekly plans for the current user in a date range (no auto-create).
     */
    @GetMapping("/me")
    public ResponseEntity<List<MyPlanSummaryResponse>> listMyPlans(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @CurrentUser UserContext user) {
        return ResponseEntity.ok(weeklyPlanService.listMyPlanSummaries(user.userId(), from, to));
    }

    @GetMapping("/existing")
    public ResponseEntity<WeeklyPlanResponse> getExistingPlan(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @CurrentUser UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getExistingPlan(user.userId(), date);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyPlanResponse> getPlanById(@PathVariable UUID id,
                                                          @CurrentUser UserContext user) {
        WeeklyPlan plan = weeklyPlanService.getPlanWithAuthCheck(id, user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<?> transitionPlan(@PathVariable UUID id,
                                            @Valid @RequestBody PlanTransitionRequest request,
                                            @CurrentUser UserContext user) {
        WeeklyPlan plan = weeklyPlanService.transitionPlan(id, request.toPlanStatus(), user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<?> unlockPlan(@PathVariable UUID id,
                                        @CurrentUser UserContext user) {
        WeeklyPlan plan = weeklyPlanService.unlockPlan(id, user);
        return ResponseEntity.ok(WeeklyPlanResponse.from(plan));
    }

    @GetMapping("/{id}/transitions")
    public ResponseEntity<List<PlanTransitionResponse>> getTransitions(@PathVariable UUID id,
                                                                       @CurrentUser UserContext user) {
        weeklyPlanService.getPlanWithAuthCheck(id, user);
        return ResponseEntity.ok(
                weeklyPlanService.getTransitions(id).stream()
                        .map(PlanTransitionResponse::from)
                        .toList()
        );
    }
}
