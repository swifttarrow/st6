package com.wct.commitment.dto;

import com.wct.commitment.ActualStatus;

import java.util.List;
import java.util.UUID;

public record BulkReconcileRequest(List<BulkReconcileItem> items) {

    public record BulkReconcileItem(UUID commitmentId, ActualStatus actualStatus, String reconciliationNotes) {
    }
}
