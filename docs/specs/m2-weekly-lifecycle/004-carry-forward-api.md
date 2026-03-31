# Task 004: Carry Forward API

## Purpose

Implement the carry-forward mechanism that pre-populates an IC's next week DRAFT plan with incomplete commitments from the prior RECONCILED week. ICs can accept, modify, or remove carried-forward items before locking.

## Inputs

- Spec: `docs/specs/m2-weekly-lifecycle/README.md`
- Files: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java` (from M2 Task 001)
- Files: `backend/src/main/java/com/wct/commitment/CommitmentService.java` (from M2 Task 002)
- Files: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` (from M2 Task 002)
- PRD: Carry Forward section, System Behavior edge case on archived Outcomes

## Outputs

- Modify: `backend/src/main/java/com/wct/plan/service/WeeklyPlanService.java` — integrate carry-forward into get-or-create
- Create: `backend/src/main/java/com/wct/commitment/service/CarryForwardService.java`
- Create: `backend/src/main/java/com/wct/plan/service/ArchivedOutcomeException.java` — exception for 409 when locking with archived outcomes
- Modify: `backend/src/main/java/com/wct/commitment/dto/CommitmentResponse.java` — add `carriedForward` flag and `outcomeArchived` flag
- Create: `backend/src/test/java/com/wct/commitment/CarryForwardTest.java`
- Side effects: new commitment rows created in the next week's plan

## Dependencies

- Prior task: `003-reconciliation-api.md`
- Required artifacts: Reconciliation flow complete, commitment entity with `carried_forward_from_id` and `actual_status`

## Constraints

- Carry-forward triggers on the first access (get-or-create) of a new week's plan when the prior week's plan is RECONCILED.
- Only commitments with `actual_status` of PARTIALLY_COMPLETED or NOT_STARTED are carried forward. COMPLETED and DROPPED items are not.
- Carried-forward commitments are new records in the new plan. They copy: description, outcomeId, and notes. They get new priorities (appended after any manually-created commitments). They set `carried_forward_from_id` to the source commitment's ID.
- If the source commitment's Outcome has been archived since last week, the carried-forward item is still created but the response must include an `outcomeArchived: true` flag so the frontend can prompt the IC to re-link before locking.
- Carry-forward is idempotent: if the new week's plan already has commitments with `carried_forward_from_id` values, do not duplicate them.
- Carry-forward only looks at the immediately prior week (the most recent Monday before the new week's Monday).
- If the prior week's plan is not RECONCILED (e.g., still LOCKED), carry-forward does not trigger — the plan is created empty.

## Required Changes

### 1. CarryForwardService

Create `CarryForwardService`:

```java
public List<Commitment> carryForward(WeeklyPlan newPlan) {
    // 1. Find prior week's plan: weekStartDate = newPlan.weekStartDate - 7 days
    // 2. If prior plan doesn't exist or status != RECONCILED, return empty list
    // 3. Find commitments in prior plan where actual_status IN (PARTIALLY_COMPLETED, NOT_STARTED)
    // 4. Filter out any already carried forward (check carried_forward_from_id in new plan)
    // 5. For each eligible commitment, create new Commitment:
    //    - weeklyPlanId = newPlan.id
    //    - outcomeId = source.outcomeId
    //    - description = source.description
    //    - notes = source.notes
    //    - priority = currentMaxPriority + index
    //    - carriedForwardFromId = source.id
    //    - actualStatus = null
    //    - reconciliationNotes = null
    // 6. Save all and return
}
```

### 2. Integrate into Get-or-Create

Modify `WeeklyPlanService.getOrCreatePlan()`:
- After creating a new DRAFT plan, call `CarryForwardService.carryForward(newPlan)`
- This ensures carry-forward happens transparently on first access

### 3. Response Flag for Archived Outcomes

Add to `CommitmentResponse`:
- `carriedForward: boolean` — true if `carried_forward_from_id` is not null
- `outcomeArchived: boolean` — true if the linked Outcome's `archived_at` is not null

This allows the frontend to show a warning on carried-forward items whose Outcome is no longer active.

### 4. Lock Validation (enhancement — modifies Task 001's `WeeklyPlanService.transitionPlan()`)

**This step modifies code created in M2 Task 001.** Add an archived-Outcome check to the DRAFT→LOCKED transition in `WeeklyPlanService.transitionPlan()`:

Modify: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java`
- In `transitionPlan()`, when `targetStatus == LOCKED`, before performing the transition:
  - Query all commitments for the plan
  - Check if any commitment's linked Outcome has `archived_at IS NOT NULL`
  - If so, return 409 with: `{ error: "ARCHIVED_OUTCOME_REFERENCES", message: "Cannot lock: commitments reference archived outcomes", commitmentIds: [...] }`
- This enforces the PRD rule that carried-forward items referencing archived Outcomes must be re-linked before locking

### 5. Tests

- First access to next week after reconciliation creates carry-forward commitments
- Only PARTIALLY_COMPLETED and NOT_STARTED are carried forward
- COMPLETED and DROPPED are not carried forward
- Carried-forward commitments have `carried_forward_from_id` set correctly
- Second access to same week does not duplicate carry-forward items (idempotent)
- If prior week is LOCKED (not reconciled), no carry-forward occurs
- If prior week doesn't exist, no carry-forward occurs
- Carried-forward item with archived Outcome has `outcomeArchived: true` in response
- Attempting to lock a plan with archived-Outcome commitments returns 409
- After IC re-links the commitment to an active Outcome, locking succeeds

## Acceptance Criteria

- [ ] First GET for a new week after reconciling the prior week creates carry-forward commitments
- [ ] Only PARTIALLY_COMPLETED and NOT_STARTED commitments are carried forward
- [ ] Each carried-forward commitment has `carriedForwardFromId` pointing to the source
- [ ] Carry-forward is idempotent — repeated GETs do not create duplicates
- [ ] If prior week is not RECONCILED, the new plan starts empty
- [ ] Commitments referencing archived Outcomes show `outcomeArchived: true`
- [ ] Plan cannot be locked if any commitment references an archived Outcome (409)
- [ ] Priorities on carried-forward items continue the sequence of existing commitments

## Validation

- [ ] `cd backend && ./gradlew test` — all carry-forward tests pass
- [ ] Manual end-to-end: reconcile week with 2 partial + 1 completed → access next week → verify 2 items carried forward

## Stop and Ask

- If carry-forward should look back further than one week (e.g., if an IC skips a week entirely), ask for clarification. Current spec only looks at the immediately prior Monday.
