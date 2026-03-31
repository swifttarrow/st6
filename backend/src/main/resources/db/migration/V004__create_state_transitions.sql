CREATE TABLE plan_state_transition (
    id UUID PRIMARY KEY,
    weekly_plan_id UUID NOT NULL REFERENCES weekly_plan(id) ON DELETE RESTRICT,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    triggered_by VARCHAR(255) NOT NULL,
    transitioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plan_transition_plan ON plan_state_transition(weekly_plan_id);
