package com.wct.commitment.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ReorderCommitmentsRequest(
        @NotEmpty(message = "Ordered commitment IDs must not be empty")
        List<@NotNull(message = "Commitment ID is required") UUID> orderedCommitmentIds
) {
}
