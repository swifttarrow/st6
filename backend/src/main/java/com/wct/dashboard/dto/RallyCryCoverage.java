package com.wct.dashboard.dto;

import java.util.UUID;

public record RallyCryCoverage(
        UUID rallyCryId,
        String rallyCryName,
        int commitmentCount,
        int memberCount,
        int consecutiveZeroWeeks
) {}
