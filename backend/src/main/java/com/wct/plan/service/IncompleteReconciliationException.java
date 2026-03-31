package com.wct.plan.service;

import java.util.List;
import java.util.UUID;

public class IncompleteReconciliationException extends RuntimeException {

    private final List<UUID> unannotatedCommitmentIds;

    public IncompleteReconciliationException(List<UUID> unannotatedCommitmentIds) {
        super("All commitments must have an actual status before reconciling");
        this.unannotatedCommitmentIds = unannotatedCommitmentIds;
    }

    public List<UUID> getUnannotatedCommitmentIds() {
        return unannotatedCommitmentIds;
    }
}
