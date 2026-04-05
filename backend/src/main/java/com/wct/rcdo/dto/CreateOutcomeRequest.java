package com.wct.rcdo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateOutcomeRequest(
        @NotNull(message = "Defining Objective ID is required") UUID definingObjectiveId,
        @NotBlank(message = "Name must not be blank") String name,
        String description
) {
}
