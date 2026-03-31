package com.wct.plan.dto;

import com.wct.plan.entity.PlanStateTransition;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlanTransitionResponse(
        UUID id,
        UUID weeklyPlanId,
        String fromStatus,
        String toStatus,
        String triggeredBy,
        OffsetDateTime transitionedAt
) {
    public static PlanTransitionResponse from(PlanStateTransition t) {
        return new PlanTransitionResponse(
                t.getId(),
                t.getWeeklyPlanId(),
                t.getFromStatus(),
                t.getToStatus(),
                t.getTriggeredBy(),
                t.getTransitionedAt()
        );
    }
}
