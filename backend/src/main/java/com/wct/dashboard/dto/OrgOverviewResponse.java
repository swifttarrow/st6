package com.wct.dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public record OrgOverviewResponse(
        LocalDate weekStartDate,
        Stats stats,
        List<RcdoHierarchyCoverage> hierarchy
) {

    public record Stats(
            int totalTeams,
            int activeRallyCries,
            int orgCommitments,
            int coverageGaps
    ) {}
}
