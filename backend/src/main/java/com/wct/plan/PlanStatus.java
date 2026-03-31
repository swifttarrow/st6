package com.wct.plan;

public enum PlanStatus {
    DRAFT, LOCKED, RECONCILING, RECONCILED;

    public boolean canTransitionTo(PlanStatus target) {
        return switch (this) {
            case DRAFT -> target == LOCKED;
            case LOCKED -> target == RECONCILING;
            case RECONCILING -> target == RECONCILED;
            case RECONCILED -> false;
        };
    }
}
