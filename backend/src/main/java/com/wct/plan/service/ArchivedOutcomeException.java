package com.wct.plan.service;

import java.util.List;
import java.util.UUID;

public class ArchivedOutcomeException extends RuntimeException {

    private final List<UUID> commitmentIds;

    public ArchivedOutcomeException(List<UUID> commitmentIds) {
        super("Cannot lock: commitments reference archived outcomes");
        this.commitmentIds = commitmentIds;
    }

    public List<UUID> getCommitmentIds() {
        return commitmentIds;
    }
}
