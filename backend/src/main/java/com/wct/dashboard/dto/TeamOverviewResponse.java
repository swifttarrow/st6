package com.wct.dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public record TeamOverviewResponse(
        LocalDate weekStartDate,
        Stats stats,
        List<TeamMemberSummary> members,
        List<RallyCryCoverage> rallyCryCoverage
) {

    public record Stats(
            int directReports,
            int plansLocked,
            int totalCommitments,
            Double avgCompletionRate
    ) {}
}
