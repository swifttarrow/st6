package com.wct.commitment.repository;

import com.wct.commitment.ActualStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface CommitmentDetailsProjection {

    UUID getId();

    String getDescription();

    int getPriority();

    String getNotes();

    UUID getOutcomeId();

    String getOutcomeName();

    UUID getDefiningObjectiveId();

    String getDefiningObjectiveName();

    UUID getRallyCryId();

    String getRallyCryName();

    ActualStatus getActualStatus();

    String getReconciliationNotes();

    UUID getCarriedForwardFromId();

    Boolean getOutcomeArchived();

    OffsetDateTime getCreatedAt();

    OffsetDateTime getUpdatedAt();
}
