package com.wct.commitment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.wct.commitment.ActualStatus;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class BulkReconcileRequest {

    private List<BulkReconcileItem> items = List.of();

    public BulkReconcileRequest() {
    }

    public BulkReconcileRequest(List<BulkReconcileItem> items) {
        this.items = Objects.requireNonNullElse(items, List.of());
    }

    public List<BulkReconcileItem> getItems() {
        return items;
    }

    public void setItems(List<BulkReconcileItem> items) {
        this.items = Objects.requireNonNullElse(items, List.of());
    }

    public static class BulkReconcileItem {
        private UUID commitmentId;
        private ActualStatus actualStatus;
        private String reconciliationNotes;

        @JsonIgnore
        private boolean reconciliationNotesPresent;

        public BulkReconcileItem() {
        }

        public BulkReconcileItem(UUID commitmentId, ActualStatus actualStatus, String reconciliationNotes) {
            this.commitmentId = commitmentId;
            this.actualStatus = actualStatus;
            this.reconciliationNotes = reconciliationNotes;
            this.reconciliationNotesPresent = true;
        }

        public UUID getCommitmentId() {
            return commitmentId;
        }

        @JsonSetter("commitmentId")
        public void setCommitmentId(UUID commitmentId) {
            this.commitmentId = commitmentId;
        }

        public ActualStatus getActualStatus() {
            return actualStatus;
        }

        @JsonSetter("actualStatus")
        public void setActualStatus(ActualStatus actualStatus) {
            this.actualStatus = actualStatus;
        }

        public String getReconciliationNotes() {
            return reconciliationNotes;
        }

        @JsonSetter("reconciliationNotes")
        public void setReconciliationNotes(String reconciliationNotes) {
            this.reconciliationNotes = reconciliationNotes;
            this.reconciliationNotesPresent = true;
        }

        @JsonIgnore
        public boolean hasReconciliationNotes() {
            return reconciliationNotesPresent;
        }
    }
}
