package com.wct.rcdo.dto;

import java.util.UUID;

public record RcdoSearchResult(UUID outcomeId, String outcomeName,
                               UUID definingObjectiveId, String definingObjectiveName,
                               UUID rallyCryId, String rallyCryName) {}
