package com.wct.plan;

public class InvalidPlanStatusException extends RuntimeException {

    private final String targetStatus;

    public InvalidPlanStatusException(String targetStatus) {
        super("Unknown status: " + targetStatus);
        this.targetStatus = targetStatus;
    }

    public String getTargetStatus() {
        return targetStatus;
    }
}
