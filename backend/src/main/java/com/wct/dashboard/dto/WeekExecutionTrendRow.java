package com.wct.dashboard.dto;

import java.time.LocalDate;

public record WeekExecutionTrendRow(
        LocalDate weekStartDate,
        int totalPlans,
        int draftCount,
        int lockedCount,
        int reconcilingCount,
        int reconciledCount,
        int totalCommitments
) {}
