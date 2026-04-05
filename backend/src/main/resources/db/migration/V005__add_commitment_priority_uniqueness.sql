ALTER TABLE commitment
    ADD CONSTRAINT uq_commitment_plan_priority UNIQUE (weekly_plan_id, priority);
