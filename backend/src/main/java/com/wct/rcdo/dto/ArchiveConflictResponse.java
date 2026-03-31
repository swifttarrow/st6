package com.wct.rcdo.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ArchiveConflictResponse(
        String message,
        int activeCommitmentCount,
        List<AffectedPlan> affectedPlans) {

    public record AffectedPlan(UUID weeklyPlanId, String userId, LocalDate weekStartDate) {}
}
