package com.wct.dashboard.dto;

import java.util.UUID;

public record RallyCryPulseRow(
        UUID rallyCryId,
        String rallyCryName,
        int commitmentCount,
        int percentOfOrgCommitments
) {}
