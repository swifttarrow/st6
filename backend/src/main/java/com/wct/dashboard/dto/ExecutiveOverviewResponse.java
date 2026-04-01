package com.wct.dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public record ExecutiveOverviewResponse(
        LocalDate focusWeekStart,
        OrgLifecycleRollup focusWeek,
        List<WeekExecutionTrendRow> eightWeekTrend,
        List<RallyCryPulseRow> rallyCryCommitmentMix
) {}
