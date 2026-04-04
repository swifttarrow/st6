package com.wct.dashboard.dto;

import java.util.UUID;

public record DefiningObjectiveCoverage(
        UUID definingObjectiveId,
        String definingObjectiveName,
        UUID rallyCryId,
        String rallyCryName,
        int commitmentCount,
        int memberCount,
        int consecutiveZeroWeeks
) {}
