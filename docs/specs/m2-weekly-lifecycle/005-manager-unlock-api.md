# Task 005: Manager Unlock API

## Purpose

Implement the manager unlock capability that allows a manager to transition an IC's weekly plan from LOCKED back to DRAFT. This is the only backward state transition in the system and is restricted to the IC's direct manager.

## Inputs

- Spec: `docs/specs/m2-weekly-lifecycle/README.md`
- Files: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java` (from M2 Task 001)
- Files: `backend/src/main/java/com/wct/plan/WeeklyPlanController.java` (from M2 Task 001)
- Files: `backend/src/main/java/com/wct/auth/UserContext.java` (from M1 Task 003)

## Outputs

- Modify: `backend/src/main/java/com/wct/plan/controller/WeeklyPlanController.java` — add unlock endpoint
- Modify: `backend/src/main/java/com/wct/plan/service/WeeklyPlanService.java` — add unlock logic
- Create: `backend/src/test/java/com/wct/plan/ManagerUnlockTest.java`
- Side effects: none

## Dependencies

- Prior task: `001-weekly-plan-api.md` (state machine)
- Required artifacts: WeeklyPlan entity, PlanStateTransition entity, UserContext with managerId

## Constraints

- Only the IC's direct manager (where `UserContext.userId` matches the plan owner's `managerId`) can unlock.
- Only plans in LOCKED state can be unlocked. Attempting to unlock a DRAFT, RECONCILING, or RECONCILED plan returns 409.
- Unlocking transitions the plan to DRAFT, allowing the IC to modify commitments again.
- The unlock transition is recorded in `plan_state_transition` with the manager's userId as `triggered_by`.
- The manager must have role MANAGER or LEADERSHIP.

## Required Changes

### 1. Unlock Endpoint

Add to `WeeklyPlanController`:

`POST /api/plans/{planId}/unlock` — Manager unlocks the IC's plan. No request body needed. Returns 200 + updated plan.

### 2. Service Logic

Add to `WeeklyPlanService`:

```java
public WeeklyPlan unlockPlan(UUID planId, UserContext managerContext) {
    // 1. Verify managerContext.role is MANAGER or LEADERSHIP
    //    → 403 if IC
    // 2. Load plan
    //    → 404 if not found
    // 3. Verify plan.status == LOCKED
    //    → 409 if not LOCKED, with message: "Plan can only be unlocked from LOCKED state"
    // 4. Verify managerContext.userId matches the plan owner's managerId
    //    → To determine this: the plan stores userId (the IC). The managerId for this IC
    //      comes from the host app context. For this milestone, we need a way to verify
    //      the manager relationship.
    //    → Approach: accept the relationship claim from the manager's request context.
    //      The manager passes X-Team-Id header; the IC's plan has a userId. We verify that
    //      the calling user's role is MANAGER/LEADERSHIP. A more robust check would
    //      query the host app, but that integration is deferred to M3.
    // 5. Set plan.status = DRAFT
    // 6. Save plan
    // 7. Log transition: from=LOCKED, to=DRAFT, triggeredBy=managerContext.userId
    // 8. Return updated plan
}
```

### 3. Tests

- Manager unlocks a LOCKED plan → plan becomes DRAFT (200)
- IC attempting to unlock returns 403
- Unlocking a DRAFT plan returns 409
- Unlocking a RECONCILING plan returns 409
- Unlocking a RECONCILED plan returns 409
- Transition audit log records LOCKED→DRAFT with manager's userId
- After unlock, IC can modify commitments again (existing commitment CRUD tests should work on the re-DRAFTed plan)

## Acceptance Criteria

- [ ] `POST /api/plans/{planId}/unlock` with Manager role transitions LOCKED plan to DRAFT
- [ ] IC role calling unlock returns 403
- [ ] Non-LOCKED plans return 409 with descriptive message
- [ ] State transition audit log records the unlock with manager's userId as `triggered_by`
- [ ] After unlock, commitment CRUD endpoints accept mutations on the plan

## Validation

- [ ] `cd backend && ./gradlew test` — all unlock tests pass
- [ ] Manual: create plan → lock → unlock as manager → verify plan is DRAFT → add a commitment (confirms CRUD works again)

## Stop and Ask

- If the manager→IC relationship verification needs to be stricter than role-based (e.g., checking against a specific org-chart API), stop and ask about the host app's org-structure contract.
