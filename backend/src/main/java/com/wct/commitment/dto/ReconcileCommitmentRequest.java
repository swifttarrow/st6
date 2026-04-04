package com.wct.commitment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.wct.commitment.ActualStatus;

public class ReconcileCommitmentRequest {

    private ActualStatus actualStatus;
    private String reconciliationNotes;

    @JsonIgnore
    private boolean reconciliationNotesPresent;

    public ReconcileCommitmentRequest() {
    }

    public ReconcileCommitmentRequest(ActualStatus actualStatus, String reconciliationNotes) {
        this.actualStatus = actualStatus;
        this.reconciliationNotes = reconciliationNotes;
        this.reconciliationNotesPresent = true;
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
