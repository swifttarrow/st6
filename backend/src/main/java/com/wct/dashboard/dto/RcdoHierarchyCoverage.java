package com.wct.dashboard.dto;

import java.util.List;
import java.util.UUID;

public record RcdoHierarchyCoverage(
        String type,
        UUID id,
        String name,
        int teamCount,
        int totalTeams,
        int commitmentCount,
        int coveragePercent,
        String status,
        Integer consecutiveZeroWeeks,
        String warningNote,
        List<RcdoHierarchyCoverage> children
) {}
