CREATE TABLE commitment (
    id UUID PRIMARY KEY,
    weekly_plan_id UUID NOT NULL REFERENCES weekly_plan(id) ON DELETE RESTRICT,
    outcome_id UUID NOT NULL REFERENCES outcome(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    priority INTEGER NOT NULL,
    notes TEXT,
    actual_status VARCHAR(30),
    reconciliation_notes TEXT,
    carried_forward_from_id UUID REFERENCES commitment(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_commitment_actual_status CHECK (actual_status IS NULL OR actual_status IN ('COMPLETED', 'PARTIALLY_COMPLETED', 'NOT_STARTED', 'DROPPED'))
);

CREATE INDEX idx_commitment_plan ON commitment(weekly_plan_id);
CREATE INDEX idx_commitment_outcome ON commitment(outcome_id);
