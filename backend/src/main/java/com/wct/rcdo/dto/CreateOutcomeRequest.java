package com.wct.rcdo.dto;

import java.util.UUID;

public record CreateOutcomeRequest(UUID definingObjectiveId, String name, String description) {
}
