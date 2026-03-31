CREATE TABLE weekly_plan (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    team_id VARCHAR(255),
    week_start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_weekly_plan_user_week UNIQUE (user_id, week_start_date),
    CONSTRAINT chk_weekly_plan_status CHECK (status IN ('DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED'))
);

CREATE INDEX idx_weekly_plan_team_week ON weekly_plan(team_id, week_start_date);
