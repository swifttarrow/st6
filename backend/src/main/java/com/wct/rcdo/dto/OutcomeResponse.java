package com.wct.rcdo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OutcomeResponse(
        UUID id,
        UUID definingObjectiveId,
        String name,
        String description,
        int sortOrder,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
