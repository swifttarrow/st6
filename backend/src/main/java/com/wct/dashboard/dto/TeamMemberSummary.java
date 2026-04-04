package com.wct.dashboard.dto;

import java.util.UUID;

public record TeamMemberSummary(
        String userId,
        UUID planId,
        String planStatus,
        int commitmentCount,
        String topRallyCry,
        Double completionRate,
        java.time.LocalDate priorWeekStartDate,
        String priorWeekStatus
) {}
