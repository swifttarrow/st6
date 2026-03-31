package com.wct.commitment.dto;

import com.wct.commitment.ActualStatus;

public record ReconcileCommitmentRequest(ActualStatus actualStatus, String reconciliationNotes) {
}
