package com.wct.plan.service;

import com.wct.plan.PlanStatus;

public class InvalidTransitionException extends RuntimeException {

    private final PlanStatus fromStatus;
    private final PlanStatus toStatus;

    public InvalidTransitionException(PlanStatus fromStatus, PlanStatus toStatus) {
        super("Cannot transition from " + fromStatus + " to " + toStatus);
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
    }

    public InvalidTransitionException(String message) {
        super(message);
        this.fromStatus = null;
        this.toStatus = null;
    }

    public PlanStatus getFromStatus() {
        return fromStatus;
    }

    public PlanStatus getToStatus() {
        return toStatus;
    }
}
