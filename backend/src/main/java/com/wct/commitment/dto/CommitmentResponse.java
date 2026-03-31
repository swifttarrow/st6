package com.wct.commitment.dto;

import com.wct.commitment.entity.Commitment;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.entity.RallyCry;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommitmentResponse(
        UUID id,
        String description,
        int priority,
        String notes,
        UUID outcomeId,
        String outcomeName,
        UUID definingObjectiveId,
        String definingObjectiveName,
        UUID rallyCryId,
        String rallyCryName,
        String actualStatus,
        String reconciliationNotes,
        UUID carriedForwardFromId,
        boolean carriedForward,
        boolean outcomeArchived,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CommitmentResponse from(Commitment c, Outcome o, DefiningObjective d, RallyCry r) {
        return new CommitmentResponse(
                c.getId(),
                c.getDescription(),
                c.getPriority(),
                c.getNotes(),
                o.getId(),
                o.getName(),
                d.getId(),
                d.getName(),
                r.getId(),
                r.getName(),
                c.getActualStatus() != null ? c.getActualStatus().name() : null,
                c.getReconciliationNotes(),
                c.getCarriedForwardFromId(),
                c.getCarriedForwardFromId() != null,
                o.getArchivedAt() != null,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
