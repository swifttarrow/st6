package com.wct.commitment.dto;

import java.util.List;
import java.util.UUID;

public record ReorderCommitmentsRequest(List<UUID> orderedCommitmentIds) {
}
