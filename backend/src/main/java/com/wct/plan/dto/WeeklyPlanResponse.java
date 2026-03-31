package com.wct.plan.dto;

import com.wct.plan.entity.WeeklyPlan;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record WeeklyPlanResponse(
        UUID id,
        String userId,
        String teamId,
        LocalDate weekStartDate,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static WeeklyPlanResponse from(WeeklyPlan plan) {
        return new WeeklyPlanResponse(
                plan.getId(),
                plan.getUserId(),
                plan.getTeamId(),
                plan.getWeekStartDate(),
                plan.getStatus().name(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}
