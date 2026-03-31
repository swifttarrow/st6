package com.wct.rcdo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RallyCryResponse(
        UUID id,
        String name,
        String description,
        int sortOrder,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
