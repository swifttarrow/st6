# Milestone 2: Weekly Commitment Lifecycle

## Outcome

A complete backend API for the weekly commitment lifecycle. After this milestone, ICs can create and manage weekly commitments linked to RCDO Outcomes, transition their weekly plan through DRAFT → LOCKED → RECONCILING → RECONCILED, reconcile with actual-status annotations, and have incomplete items automatically carry forward to the next week. Managers can unlock an IC's locked plan.

## Scope

- Weekly plan creation and retrieval (auto-created on first access for a given week)
- Commitment CRUD (create, read, update, delete) with mandatory Outcome linking
- Priority ordering (drag-to-reorder / explicit rank)
- State machine enforcement for weekly plan transitions
- Manager unlock (LOCKED → DRAFT)
- Reconciliation: annotating each commitment with actual status and notes
- Carry-forward: pre-populating next week's DRAFT with incomplete items from prior RECONCILED week
- State transition audit logging

## Out of Scope

- Frontend screens (M3)
- Manager dashboard and leadership roll-up APIs (M4)
- Notifications, trend analytics, 15-Five migration (deferred per PRD)

## Source Inputs

- PRD: `docs/prd.md` (sections: Weekly Commitment Management, Strategy Layer, Weekly Lifecycle State Machine, Carry Forward, Reconciliation View, System Behavior and Edge Cases)
- Spec: `docs/specs/m1-data-foundation/README.md` (schema definitions, entity classes)

## Constraints

- All M1 schema and entities are assumed to exist. This milestone does not create new migrations.
- Week boundaries: Monday 00:00 UTC through Friday 23:59 UTC. `week_start_date` is always a Monday.
- State machine transitions are strictly enforced. The only valid transitions are: DRAFT→LOCKED, LOCKED→RECONCILING, RECONCILING→RECONCILED, and LOCKED→DRAFT (manager unlock only).
- Commitments can only be created/updated/deleted when the plan is in DRAFT state.
- Each commitment must reference exactly one active (non-archived) Outcome.
- Priority is an integer rank starting at 1. Reordering updates the rank of all affected commitments.
- Reconciliation requires every commitment to have an `actual_status` before the plan can transition to RECONCILED.
- Carry-forward creates new commitment records in the next week's plan, with `carried_forward_from_id` linking back to the source.

## Decisions

- A weekly plan is auto-created in DRAFT state when an IC first accesses a given week, rather than requiring explicit creation.
- Carry-forward happens when the IC first accesses the next week after reconciling the current one — it is not a background job.
- Manager unlock requires the manager's `userId` to match the IC's `managerId` (i.e., only direct managers can unlock).
- Reordering priorities is a batch operation that accepts an ordered list of commitment IDs and reassigns ranks 1..N.

## Assumptions

- M1's `UserContext` mechanism and entities are in place and functional.
- The commitment table, weekly_plan table, and plan_state_transition table exist per M1 migrations.

## Task Order

1. `001-weekly-plan-api.md` — Plan creation/retrieval and the state machine. Foundation for all commitment operations.
2. `002-commitment-crud-api.md` — Commitment CRUD with Outcome linking and priority ordering. Depends on plan existing.
3. `003-reconciliation-api.md` — Reconciliation flow: annotating commitments and transitioning to RECONCILED. Depends on commitments existing.
4. `004-carry-forward-api.md` — Carry-forward logic: populating next week from prior reconciled week. Depends on reconciliation being complete.
5. `005-manager-unlock-api.md` — Manager unlock transition (LOCKED → DRAFT). Independent of reconciliation but depends on state machine from Task 001.

## Milestone Success Criteria

- A weekly plan can be created, transitioned through all four states, and the transitions are audit-logged
- Commitments can be created, updated, reordered, and deleted only in DRAFT state
- Each commitment is linked to a valid active Outcome
- Reconciliation requires all commitments to have an actual_status
- Carry-forward pre-populates incomplete items into the next week's DRAFT
- A manager can unlock an IC's LOCKED plan back to DRAFT
- Invalid state transitions return 409

## Milestone Validation

- `cd backend && ./gradlew test` — all lifecycle tests pass
- Manual end-to-end: create plan → add commitments → lock → begin reconciliation → annotate all → reconcile → access next week → verify carry-forward items appear

## Risks / Follow-ups

- Carry-forward with archived Outcomes: if an Outcome is archived between weeks, carried-forward items must be flagged. This edge case is handled in Task 004.
- Concurrent access: two browser tabs could theoretically submit conflicting state transitions. Optimistic locking via `updated_at` column is recommended but not strictly required for first release.
