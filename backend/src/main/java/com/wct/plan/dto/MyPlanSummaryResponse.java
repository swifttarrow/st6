package com.wct.plan.dto;

import java.time.LocalDate;
import java.util.UUID;

public record MyPlanSummaryResponse(
        UUID id,
        LocalDate weekStartDate,
        String status,
        long commitmentCount
) {}
