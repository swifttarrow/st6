package com.wct.commitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateCommitmentRequest(
        @NotBlank(message = "Description must not be blank") String description,
        @NotNull(message = "Outcome ID is required") UUID outcomeId,
        String notes
) {
}
