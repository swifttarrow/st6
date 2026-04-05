package com.wct.rcdo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDefiningObjectiveRequest(
        @NotNull(message = "Rally Cry ID is required") UUID rallyCryId,
        @NotBlank(message = "Name must not be blank") String name,
        String description
) {
}
