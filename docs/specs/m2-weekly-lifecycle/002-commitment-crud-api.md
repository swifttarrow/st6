# Task 002: Commitment CRUD API

## Purpose

Implement the endpoints for creating, reading, updating, deleting, and reordering weekly commitments. Each commitment is linked to exactly one RCDO Outcome and belongs to a weekly plan. Commitment mutations are only allowed when the plan is in DRAFT state.

## Inputs

- Spec: `docs/specs/m2-weekly-lifecycle/README.md`
- Files: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` (minimal entity from M1 Task 005)
- Files: `backend/src/main/java/com/wct/commitment/repository/CommitmentRepository.java` (minimal from M1 Task 005)
- Files: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java` (from M2 Task 001)
- Files: `backend/src/main/java/com/wct/rcdo/entity/Outcome.java` (from M1 Task 003)

## Outputs

- Modify: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` — expand to full entity
- Modify: `backend/src/main/java/com/wct/commitment/repository/CommitmentRepository.java` — add query methods
- Create: `backend/src/main/java/com/wct/commitment/controller/CommitmentController.java`
- Create: `backend/src/main/java/com/wct/commitment/service/CommitmentService.java`
- Create: `backend/src/main/java/com/wct/commitment/dto/CreateCommitmentRequest.java`
- Create: `backend/src/main/java/com/wct/commitment/dto/UpdateCommitmentRequest.java`
- Create: `backend/src/main/java/com/wct/commitment/dto/ReorderCommitmentsRequest.java`
- Create: `backend/src/main/java/com/wct/commitment/dto/CommitmentResponse.java`
- Create: `backend/src/test/java/com/wct/commitment/controller/CommitmentControllerTest.java`
- Side effects: none

## Dependencies

- Prior task: `001-weekly-plan-api.md`
- Required artifacts: WeeklyPlan entity and service, Commitment entity and repository, Outcome entity

## Constraints

- Commitments can only be created, updated, deleted, or reordered when the parent plan is in DRAFT state. All other states return 409.
- Each commitment must reference an active (non-archived) Outcome. Referencing an archived Outcome returns 400.
- Priority is an integer rank. On creation, the new commitment gets rank = (current max rank + 1). Reordering is a separate batch endpoint.
- Only the plan owner (IC) can mutate commitments on their plan.
- The commitment description is required and cannot be empty.
- Notes are optional.
- **Reorder validation**: The `orderedCommitmentIds` array must include ALL commitment IDs belonging to the plan, with no duplicates, no missing IDs, and no extra IDs. If the count doesn't match or any ID is unrecognized, return 400 with message: "orderedCommitmentIds must include all commitments in the plan exactly once."

## Required Changes

### 1. Use Commitment Entity (from M1 Task 002)

The `Commitment` entity already exists from M1 Task 002 with all columns: id, weeklyPlanId, outcomeId, description, priority, notes, actualStatus, reconciliationNotes, carriedForwardFromId, createdAt, updatedAt. Verify it has `actualStatus` mapped as `@Enumerated(EnumType.STRING)` (nullable). Add any convenience methods needed (e.g., `isReconciled()`).

### 2. Expand Repository

Add methods:
- `findByWeeklyPlanIdOrderByPriority(UUID planId): List<Commitment>`
- `countByWeeklyPlanId(UUID planId): int`
- `findByWeeklyPlanIdAndActualStatusIsNull(UUID planId): List<Commitment>` — for reconciliation validation

### 3. REST Endpoints

Base path: `/api/plans/{planId}/commitments`

- `POST /` — Create commitment. Body: `{ description, outcomeId, notes? }`. Auto-assigns priority = next rank. Returns 201 + commitment.
- `GET /` — List commitments for the plan, ordered by priority. Returns 200 + array.
- `GET /{commitmentId}` — Get single commitment. Returns 200 or 404.
- `PUT /{commitmentId}` — Update commitment. Body: `{ description?, outcomeId?, notes? }`. Returns 200 + updated commitment.
- `DELETE /{commitmentId}` — Delete commitment. Recompacts priorities of remaining items. Returns 204.
- `PUT /reorder` — Batch reorder. Body: `{ orderedCommitmentIds: ["id1", "id2", ...] }`. Reassigns priority 1..N in the given order. Returns 200 + reordered list.

### 4. Service Logic

`CommitmentService`:
- `create(UUID planId, CreateCommitmentRequest req, UserContext user)`:
  - Verify plan exists, user owns it, plan is DRAFT
  - Verify outcomeId references an active Outcome
  - Set priority = count of existing commitments + 1
  - Save and return
- `update(UUID planId, UUID commitmentId, UpdateCommitmentRequest req, UserContext user)`:
  - Verify plan DRAFT, user owns it, commitment belongs to plan
  - If outcomeId changed, verify new Outcome is active
  - Save and return
- `delete(UUID planId, UUID commitmentId, UserContext user)`:
  - Verify plan DRAFT, user owns it
  - Delete commitment
  - Recompact: reassign priorities 1..N for remaining commitments ordered by current priority
- `reorder(UUID planId, ReorderCommitmentsRequest req, UserContext user)`:
  - Verify plan DRAFT, user owns it
  - Verify all IDs in the request belong to this plan and the count matches
  - Assign priority 1 to first ID, 2 to second, etc.
  - Save all

### 5. Response DTO

`CommitmentResponse`:
```
{
  id, description, priority, notes,
  outcomeId, outcomeName,
  definingObjectiveId, definingObjectiveName,
  rallyCryId, rallyCryName,
  actualStatus, reconciliationNotes,
  carriedForwardFromId,
  createdAt, updatedAt
}
```

Include the full RCDO path (Outcome + DO + RC names) in each commitment response so the frontend can display "RC1 > DO1 > Outcome 1" without extra API calls.

### 6. Tests

- Create commitment on DRAFT plan succeeds
- Create commitment on LOCKED plan returns 409
- Create commitment with archived Outcome returns 400
- Create commitment with non-existent Outcome returns 404
- Update commitment description and outcomeId succeeds on DRAFT plan
- Delete commitment recompacts priorities
- Reorder with valid IDs updates priorities correctly
- Reorder with missing/extra IDs returns 400
- Non-owner IC attempting CRUD returns 403
- CommitmentResponse includes RCDO path names

## Acceptance Criteria

- [ ] `POST /api/plans/{planId}/commitments` creates a commitment and returns 201 with auto-assigned priority
- [ ] `GET /api/plans/{planId}/commitments` returns commitments ordered by priority
- [ ] `PUT /api/plans/{planId}/commitments/{id}` updates description and/or outcomeId
- [ ] `DELETE /api/plans/{planId}/commitments/{id}` removes the commitment and recompacts remaining priorities
- [ ] `PUT /api/plans/{planId}/commitments/reorder` reassigns priorities in the given order
- [ ] All mutation endpoints return 409 when plan is not in DRAFT state
- [ ] Creating a commitment with an archived Outcome returns 400
- [ ] Each commitment response includes outcomeName, definingObjectiveName, rallyCryName
- [ ] Non-owner access returns 403

## Validation

- [ ] `cd backend && ./gradlew test` — all commitment tests pass
- [ ] Manual: create plan, add 3 commitments, reorder, delete one, verify priorities are 1, 2

## Stop and Ask

- If the reorder endpoint needs to support partial reordering (reordering a subset), ask for clarification. Current spec assumes all commitment IDs for the plan must be provided.
