package com.wct.dashboard.dto;

public record OrgLifecycleRollup(
        int totalPlans,
        int draftCount,
        int lockedCount,
        int reconcilingCount,
        int reconciledCount,
        int distinctUsers,
        int distinctTeams,
        int totalCommitments
) {}
