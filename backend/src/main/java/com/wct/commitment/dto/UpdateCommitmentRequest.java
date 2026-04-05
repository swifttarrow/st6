package com.wct.commitment.dto;

import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record UpdateCommitmentRequest(
        @Pattern(regexp = ".*\\S.*", message = "Description must not be blank") String description,
        UUID outcomeId,
        String notes
) {
}
