# Task 002: Database Schema

## Purpose

Create all SQL migration files that define the data model for the Weekly Commitment Tracker. This includes the RCDO hierarchy tables, weekly plan table, commitment table, and the state-transition audit log. Establishing the full schema now (not just RCDO) avoids migration conflicts when M2 begins.

## Inputs

- Spec: `docs/specs/m1-data-foundation/README.md`
- Files: `backend/src/main/resources/application.yml` (from Task 001)
- PRD sections: Strategic Hierarchy Management, Weekly Commitment Management, Weekly Lifecycle State Machine, Carry Forward, Reconciliation View

## Outputs

- Create: `backend/src/main/resources/db/migration/V001__create_rcdo_hierarchy.sql`
- Create: `backend/src/main/resources/db/migration/V002__create_weekly_plans.sql`
- Create: `backend/src/main/resources/db/migration/V003__create_commitments.sql`
- Create: `backend/src/main/resources/db/migration/V004__create_state_transitions.sql`
- Create: `backend/src/main/java/com/wct/rcdo/entity/RallyCry.java`
- Create: `backend/src/main/java/com/wct/rcdo/entity/DefiningObjective.java`
- Create: `backend/src/main/java/com/wct/rcdo/entity/Outcome.java`
- Create: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java`
- Create: `backend/src/main/java/com/wct/plan/PlanStatus.java`
- Create: `backend/src/main/java/com/wct/commitment/entity/Commitment.java`
- Create: `backend/src/main/java/com/wct/commitment/ActualStatus.java`
- Create: `backend/src/main/java/com/wct/plan/entity/PlanStateTransition.java`
- Side effects: Flyway will apply these migrations on application startup

## Dependencies

- Prior task: `001-project-scaffolding.md`
- Required artifacts: `backend/build.gradle.kts` with Flyway configured, `application.yml` with datasource

## Constraints

- All tables must use UUID primary keys for portability
- Timestamps must be stored as `TIMESTAMP WITH TIME ZONE`
- Use Flyway versioned migrations (V001, V002, etc.)
- `week_start_date` on weekly_plan is always a Monday (DATE type, application-enforced)
- The schema must be compatible with both H2 (dev) and PostgreSQL (prod) — avoid vendor-specific syntax
- All foreign keys must use `ON DELETE RESTRICT` (or default NO ACTION) — never cascade deletes, to preserve historical records
- Foreign keys must enforce referential integrity between hierarchy levels and between commitments and outcomes
- Soft-delete via `archived_at` column on RCDO tables (nullable timestamp)
- `weekly_plan.status` valid values are exactly: `'DRAFT'`, `'LOCKED'`, `'RECONCILING'`, `'RECONCILED'` — add a CHECK constraint
- `commitment.actual_status` valid values are exactly: `'COMPLETED'`, `'PARTIALLY_COMPLETED'`, `'NOT_STARTED'`, `'DROPPED'` — add a CHECK constraint

## Required Changes

### V001 — RCDO Hierarchy

1. Create table `rally_cry`:
   - `id` UUID PRIMARY KEY
   - `name` VARCHAR(255) NOT NULL
   - `description` TEXT
   - `sort_order` INTEGER NOT NULL DEFAULT 0
   - `archived_at` TIMESTAMP WITH TIME ZONE
   - `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

2. Create table `defining_objective`:
   - `id` UUID PRIMARY KEY
   - `rally_cry_id` UUID NOT NULL REFERENCES rally_cry(id)
   - `name` VARCHAR(255) NOT NULL
   - `description` TEXT
   - `sort_order` INTEGER NOT NULL DEFAULT 0
   - `archived_at` TIMESTAMP WITH TIME ZONE
   - `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

3. Create table `outcome`:
   - `id` UUID PRIMARY KEY
   - `defining_objective_id` UUID NOT NULL REFERENCES defining_objective(id)
   - `name` VARCHAR(255) NOT NULL
   - `description` TEXT
   - `sort_order` INTEGER NOT NULL DEFAULT 0
   - `archived_at` TIMESTAMP WITH TIME ZONE
   - `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

### V002 — Weekly Plans

4. Create table `weekly_plan`:
   - `id` UUID PRIMARY KEY
   - `user_id` VARCHAR(255) NOT NULL — external user ID from host app
   - `team_id` VARCHAR(255) — external team ID from host app (set on creation from UserContext; used for leadership cross-team queries in M4)
   - `week_start_date` DATE NOT NULL — always a Monday
   - `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
   - CHECK constraint: `status IN ('DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED')`
   - `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - UNIQUE constraint on (user_id, week_start_date)
   - Index: `CREATE INDEX idx_weekly_plan_team_week ON weekly_plan(team_id, week_start_date)`

### V003 — Commitments

5. Create table `commitment`:
   - `id` UUID PRIMARY KEY
   - `weekly_plan_id` UUID NOT NULL REFERENCES weekly_plan(id)
   - `outcome_id` UUID NOT NULL REFERENCES outcome(id)
   - `description` TEXT NOT NULL
   - `priority` INTEGER NOT NULL — 1 = highest
   - `notes` TEXT — optional IC notes during planning
   - `actual_status` VARCHAR(30) — nullable; set during reconciliation
   - CHECK constraint: `actual_status IS NULL OR actual_status IN ('COMPLETED', 'PARTIALLY_COMPLETED', 'NOT_STARTED', 'DROPPED')`
   - `reconciliation_notes` TEXT — optional notes during reconciliation
   - `carried_forward_from_id` UUID REFERENCES commitment(id) — nullable; links to source commitment if carried forward
   - `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

### V004 — State Transition Audit

6. Create table `plan_state_transition`:
   - `id` UUID PRIMARY KEY
   - `weekly_plan_id` UUID NOT NULL REFERENCES weekly_plan(id)
   - `from_status` VARCHAR(20) NOT NULL
   - `to_status` VARCHAR(20) NOT NULL
   - `triggered_by` VARCHAR(255) NOT NULL — user ID of who triggered
   - `transitioned_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

### Indexes (add to the relevant migration files)

- `CREATE INDEX idx_defining_objective_rally_cry ON defining_objective(rally_cry_id)` — V001
- `CREATE INDEX idx_outcome_do ON outcome(defining_objective_id)` — V001
- `CREATE INDEX idx_outcome_name ON outcome(name)` — V001 (supports search in Task 004)
- `CREATE INDEX idx_commitment_plan ON commitment(weekly_plan_id)` — V003
- `CREATE INDEX idx_commitment_outcome ON commitment(outcome_id)` — V003
- `CREATE INDEX idx_plan_transition_plan ON plan_state_transition(weekly_plan_id)` — V004

### JPA Entities (create alongside migrations)

Create full JPA entity classes for all tables. These are the authoritative entity definitions used by M1 Tasks 003–005 and all of M2.

- Create: `backend/src/main/java/com/wct/rcdo/entity/RallyCry.java` — maps to `rally_cry`
- Create: `backend/src/main/java/com/wct/rcdo/entity/DefiningObjective.java` — maps to `defining_objective`
- Create: `backend/src/main/java/com/wct/rcdo/entity/Outcome.java` — maps to `outcome`
- Create: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java` — maps to `weekly_plan`, includes all columns (id, userId, teamId, weekStartDate, status, createdAt, updatedAt)
- Create: `backend/src/main/java/com/wct/plan/PlanStatus.java` — enum: DRAFT, LOCKED, RECONCILING, RECONCILED (mapped as string in JPA)
- Create: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` — maps to `commitment`, includes all columns
- Create: `backend/src/main/java/com/wct/commitment/ActualStatus.java` — enum: COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED
- Create: `backend/src/main/java/com/wct/plan/entity/PlanStateTransition.java` — maps to `plan_state_transition`

All entity classes must use:
- `@Id` with UUID
- `@Column` annotations mapping to exact column names
- Enum fields mapped with `@Enumerated(EnumType.STRING)`
- `@CreationTimestamp` / `@UpdateTimestamp` for timestamp fields

## Acceptance Criteria

- [ ] All four migration files exist under `backend/src/main/resources/db/migration/`
- [ ] Application starts and Flyway applies all migrations without error
- [ ] `rally_cry`, `defining_objective`, `outcome` tables have `archived_at` column for soft-delete
- [ ] `weekly_plan` has a UNIQUE constraint on (user_id, week_start_date)
- [ ] `commitment.outcome_id` references `outcome.id` with a foreign key
- [ ] `commitment.carried_forward_from_id` is a self-referencing nullable foreign key
- [ ] `plan_state_transition` records who triggered each transition and when
- [ ] All UUID columns are primary keys
- [ ] All timestamp columns use `TIMESTAMP WITH TIME ZONE`
- [ ] `weekly_plan.status` has a CHECK constraint limiting to DRAFT, LOCKED, RECONCILING, RECONCILED
- [ ] `commitment.actual_status` has a CHECK constraint limiting to COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED (or NULL)
- [ ] All foreign keys use RESTRICT/NO ACTION (no cascade deletes)
- [ ] Indexes exist for all foreign key columns and `outcome.name`
- [ ] `weekly_plan` includes `team_id` column (nullable VARCHAR)
- [ ] JPA entity classes exist for all 7 tables/enums and compile without errors

## Validation

- [ ] `cd backend && ./gradlew bootRun` starts without migration errors (H2 dev profile)
- [ ] `cd backend && ./gradlew test` passes (context-loads test confirms migrations apply)
- [ ] Inspect H2 console (if enabled) or run `./gradlew bootRun` and verify tables exist via a test query

## Stop and Ask

- If H2 does not support a particular SQL syntax needed for the schema, ask before switching to PostgreSQL-only syntax or altering the column definition.
