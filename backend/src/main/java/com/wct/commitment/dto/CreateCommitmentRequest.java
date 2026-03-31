package com.wct.commitment.dto;

import java.util.UUID;

public record CreateCommitmentRequest(String description, UUID outcomeId, String notes) {
}
