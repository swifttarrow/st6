package com.wct.plan.dto;

import com.wct.plan.InvalidPlanStatusException;
import com.wct.plan.PlanStatus;
import jakarta.validation.constraints.NotBlank;

import java.util.Locale;

public record PlanTransitionRequest(@NotBlank(message = "Target status is required") String targetStatus) {

    public PlanStatus toPlanStatus() {
        try {
            return PlanStatus.valueOf(targetStatus.trim().toUpperCase(Locale.US));
        } catch (IllegalArgumentException ex) {
            throw new InvalidPlanStatusException(targetStatus);
        }
    }
}
