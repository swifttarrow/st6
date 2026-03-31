package com.wct.rcdo.dto;

import java.util.UUID;

public record CreateDefiningObjectiveRequest(UUID rallyCryId, String name, String description) {
}
