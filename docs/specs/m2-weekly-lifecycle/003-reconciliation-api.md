# Task 003: Reconciliation API

## Purpose

Implement the reconciliation flow where ICs annotate each commitment with an actual status and optional notes, then finalize the week. This enforces the PRD requirement that all commitments must have an actual status before a plan can transition to RECONCILED.

## Inputs

- Spec: `docs/specs/m2-weekly-lifecycle/README.md`
- Files: `backend/src/main/java/com/wct/commitment/CommitmentService.java` (from M2 Task 002)
- Files: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java` (from M2 Task 001)
- Design reference: `st6.pen` frame `69svb` — Reconciliation screen showing actual-status dropdowns and notes per commitment

## Outputs

- Create: `backend/src/main/java/com/wct/commitment/dto/ReconcileCommitmentRequest.java`
- Create: `backend/src/main/java/com/wct/commitment/dto/BulkReconcileRequest.java`
- Create: `backend/src/main/java/com/wct/commitment/ActualStatus.java` — enum
- Modify: `backend/src/main/java/com/wct/commitment/controller/CommitmentController.java` — add reconciliation endpoints
- Modify: `backend/src/main/java/com/wct/commitment/service/CommitmentService.java` — add reconciliation logic
- Modify: `backend/src/main/java/com/wct/plan/service/WeeklyPlanService.java` — add reconciliation completeness check before RECONCILING→RECONCILED transition
- Create: `backend/src/main/java/com/wct/plan/service/IncompleteReconciliationException.java` — exception for 409 with unannotated IDs
- Create: `backend/src/test/java/com/wct/commitment/ReconciliationTest.java`
- Side effects: none

## Dependencies

- Prior task: `002-commitment-crud-api.md`
- Required artifacts: Commitment entity, CommitmentService, WeeklyPlanService with state machine

## Constraints

- Reconciliation annotations (actual_status, reconciliation_notes) can only be set when the plan is in RECONCILING state.
- The `actual_status` enum values are: COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED (matching the design's dropdown options).
- Transitioning from RECONCILING to RECONCILED requires ALL commitments in the plan to have a non-null `actual_status`. If any are missing, return 409 with a list of unannotated commitment IDs.
- Reconciliation notes are optional per commitment.
- An IC can update the actual_status and notes multiple times while in RECONCILING state (before submitting).

## Required Changes

### 1. ActualStatus Enum

```java
public enum ActualStatus {
    COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED
}
```

### 2. Reconciliation Endpoints

Add to `CommitmentController`:

- `PATCH /api/plans/{planId}/commitments/{commitmentId}/reconcile` — Set actual status and notes for a single commitment. Body: `{ actualStatus: "COMPLETED", reconciliationNotes?: "Shipped Wednesday" }`. Only allowed when plan is RECONCILING. Returns 200 + updated commitment.

- `PATCH /api/plans/{planId}/commitments/reconcile` — Bulk reconcile. Body: `{ items: [{ commitmentId, actualStatus, reconciliationNotes? }, ...] }`. Sets all provided annotations in one call. Returns 200 + list of updated commitments.

### 3. Reconciliation Completeness Check

Modify `WeeklyPlanService.transitionPlan()`:
- When target status is RECONCILED, call `CommitmentService.getUnannotatedCommitments(planId)`
- If any commitments lack `actual_status`, return 409 with:
  ```json
  {
    "error": "INCOMPLETE_RECONCILIATION",
    "message": "All commitments must have an actual status before reconciling",
    "unannotatedCommitmentIds": ["id1", "id2"]
  }
  ```
- If all are annotated, proceed with transition

### 4. Service Logic

`CommitmentService.reconcile(UUID planId, UUID commitmentId, ReconcileCommitmentRequest req, UserContext user)`:
- Verify plan exists, user owns it, plan is RECONCILING
- Verify commitment belongs to plan
- Set `actual_status` and `reconciliation_notes`
- Save and return

`CommitmentService.bulkReconcile(UUID planId, BulkReconcileRequest req, UserContext user)`:
- Same verifications
- Update all provided commitments in one transaction
- Return updated list

`CommitmentService.getUnannotatedCommitments(UUID planId)`:
- Return commitments where `actual_status IS NULL`

### 5. Tests

- Single reconcile sets actual_status on a commitment in RECONCILING plan
- Bulk reconcile sets actual_status on multiple commitments
- Reconcile on a DRAFT plan returns 409
- Reconcile on a LOCKED plan returns 409
- Transition to RECONCILED with all annotated succeeds
- Transition to RECONCILED with unannotated commitments returns 409 with IDs
- Reconciliation notes are optional (null is acceptable)
- IC can update actual_status multiple times in RECONCILING state
- Non-owner IC cannot reconcile another's commitments (403)

## Acceptance Criteria

- [ ] `PATCH /api/plans/{planId}/commitments/{id}/reconcile` sets actual_status when plan is RECONCILING
- [ ] `PATCH /api/plans/{planId}/commitments/reconcile` bulk-sets actual_status for multiple commitments
- [ ] Reconciling on non-RECONCILING plan returns 409
- [ ] Transition to RECONCILED with unannotated commitments returns 409 listing the missing IDs
- [ ] Transition to RECONCILED with all annotated succeeds and logs the transition
- [ ] Actual status values match enum: COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED
- [ ] Reconciliation notes are optional and preserved

## Validation

- [ ] `cd backend && ./gradlew test` — all reconciliation tests pass
- [ ] Manual: create plan → add commitments → lock → start reconciliation → annotate some → try finalize (409) → annotate remaining → finalize (200)

## Stop and Ask

- If additional actual-status values are needed beyond the four defined, ask before adding them.
