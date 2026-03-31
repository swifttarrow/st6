# Task 001: Weekly Plan API and State Machine

## Purpose

Implement the weekly plan creation, retrieval, and state machine transition endpoints. The weekly plan is the container for an IC's commitments for a given week, and its state governs what operations are allowed.

## Inputs

- Spec: `docs/specs/m2-weekly-lifecycle/README.md`
- Files: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java` (minimal entity from M1 Task 005)
- Files: `backend/src/main/resources/db/migration/V002__create_weekly_plans.sql` (schema)
- Files: `backend/src/main/resources/db/migration/V004__create_state_transitions.sql` (audit schema)
- Files: `backend/src/main/java/com/wct/auth/UserContext.java` (from M1 Task 003)

## Outputs

- Modify: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java` — expand to full entity with all fields
- Create: `backend/src/main/java/com/wct/plan/WeeklyPlanController.java`
- Create: `backend/src/main/java/com/wct/plan/WeeklyPlanService.java`
- Create: `backend/src/main/java/com/wct/plan/repository/WeeklyPlanRepository.java`
- Create: `backend/src/main/java/com/wct/plan/dto/WeeklyPlanResponse.java`
- Create: `backend/src/main/java/com/wct/plan/dto/PlanTransitionRequest.java`
- Create: `backend/src/main/java/com/wct/plan/PlanStatus.java` — enum: DRAFT, LOCKED, RECONCILING, RECONCILED
- Create: `backend/src/main/java/com/wct/plan/entity/PlanStateTransition.java` — JPA entity
- Create: `backend/src/main/java/com/wct/plan/repository/PlanStateTransitionRepository.java`
- Create: `backend/src/main/java/com/wct/plan/WeekDateUtil.java` — utility to compute Monday of a given date
- Create: `backend/src/test/java/com/wct/plan/WeeklyPlanControllerTest.java`
- Create: `backend/src/test/java/com/wct/plan/WeekDateUtilTest.java`
- Side effects: none

## Dependencies

- Prior task: none (within M2), but requires M1 fully completed
- Required artifacts: WeeklyPlan entity, migration V002, V004, UserContext

## Constraints

- Plans are scoped to a user + week. The `(user_id, week_start_date)` UNIQUE constraint enforces this.
- `week_start_date` is always a Monday. The API accepts any date and normalizes to the Monday of that week.
- Plans are auto-created in DRAFT state on first GET for a user+week combination (get-or-create pattern).
- An IC can only access their own plans. A Manager can read (but not modify) their direct reports' plans.
- Valid forward transitions: DRAFT→LOCKED, LOCKED→RECONCILING, RECONCILING→RECONCILED. All IC-initiated.
- The only backward transition (LOCKED→DRAFT) is covered in Task 005 (manager unlock).
- Every transition writes a row to `plan_state_transition` with who triggered it and when.
- Invalid transitions return HTTP 409 with a message explaining the allowed transitions from the current state.

## Required Changes

### 1. Week Date Utility

Create `WeekDateUtil` with:
- `toMonday(LocalDate date): LocalDate` — returns the Monday of the week containing `date`. If `date` is already Monday, returns it unchanged.
- Weeks run Mon–Fri per PRD constraint.

### 2. PlanStatus Enum

```java
public enum PlanStatus {
    DRAFT, LOCKED, RECONCILING, RECONCILED;

    public boolean canTransitionTo(PlanStatus target) {
        return switch (this) {
            case DRAFT -> target == LOCKED;
            case LOCKED -> target == RECONCILING; // LOCKED→DRAFT handled separately (manager unlock)
            case RECONCILING -> target == RECONCILED;
            case RECONCILED -> false;
        };
    }
}
```

### 3. WeeklyPlan Entity (use and extend from M1 Task 002)

The entity already exists from M1 Task 002 with all columns. This task may add convenience methods (e.g., `isEditable()` returning `status == DRAFT`) but does not recreate the entity. If optimistic locking via `@Version` on `updatedAt` is not already present, add it.

### 4. Repository

`WeeklyPlanRepository`:
- `findByUserIdAndWeekStartDate(String userId, LocalDate weekStartDate): Optional<WeeklyPlan>`
- `findByUserIdAndWeekStartDateOrderByWeekStartDateDesc(String userId): List<WeeklyPlan>` — for history
- `findByUserIdInAndWeekStartDate(List<String> userIds, LocalDate weekStartDate): List<WeeklyPlan>` — for manager dashboard (M4)

### 5. REST Endpoints

Base path: `/api/plans`

- `GET /api/plans?date={yyyy-MM-dd}` — Get-or-create the plan for the authenticated user and the week containing `date`. Normalizes date to Monday. Returns 200 + plan with status and metadata.
- `GET /api/plans/{id}` — Get plan by ID. Authorization rules:
  - IC: can only access plans where `plan.userId == currentUser.userId`. Otherwise 403.
  - Manager: can access own plans AND plans belonging to users whose `managerId` matches the current user's `userId`. The manager relationship is claimed via the host-app context; for first release, the backend trusts this claim.
  - Leadership: can access any plan (read-only).
- `POST /api/plans/{id}/transition` — Transition the plan to the next state. Body: `{ "targetStatus": "LOCKED" }`. Only the plan owner (IC) can transition forward. Returns 200 + updated plan, or 409 if invalid transition.
- `GET /api/plans/{id}/transitions` — Get audit log of state transitions for a plan. Returns 200 + array of transitions.

### 6. Service Logic

`WeeklyPlanService`:
- `getOrCreatePlan(String userId, LocalDate date, UserContext user)`: Look up by userId + toMonday(date). If not found, create new plan in DRAFT state. Set `team_id` from `user.teamId` on creation.
- `transitionPlan(UUID planId, PlanStatus targetStatus, UserContext user)`:
  - Verify user owns the plan
  - Verify current status can transition to target (via `canTransitionTo`)
  - If transitioning to LOCKED: verify no commitment references an archived Outcome (409 with affected commitment IDs if any do). **Note**: this check is added by M2 Task 004 — for now, implement the transition without this check. Task 004 will modify this method.
  - If transitioning to RECONCILED, verify all commitments have `actual_status` set (delegate to commitment service — for now, add a TODO/interface that M2 Task 003 will implement)
  - Update status, save, log transition to `plan_state_transition`
- `getPlanWithAuthCheck(UUID planId, UserContext user)`: Load plan, verify access per authorization rules (IC: own only; Manager: own + direct reports; Leadership: any). Return 403 if unauthorized.

### 7. Tests

- Get-or-create: first GET creates a DRAFT plan, second GET returns the same plan
- Date normalization: GET with a Wednesday returns the plan for that week's Monday
- DRAFT→LOCKED succeeds
- LOCKED→RECONCILING succeeds
- RECONCILING→RECONCILED succeeds (with all commitments annotated)
- DRAFT→RECONCILING returns 409
- LOCKED→RECONCILED returns 409
- RECONCILED→anything returns 409
- Non-owner IC accessing another's plan returns 403
- Manager can GET a direct report's plan (200)
- Manager cannot GET a non-report's plan (403)
- Leadership can GET any plan (200)
- Transition audit log records each transition with correct from/to/triggeredBy
- Plan with zero commitments can be locked (valid per PRD — empty week)
- Plan with zero commitments can transition RECONCILING→RECONCILED (no annotations needed when there are no commitments)

## Acceptance Criteria

- [ ] `GET /api/plans?date=2026-03-30` returns a DRAFT plan for the authenticated IC
- [ ] Subsequent GET for the same week returns the same plan (idempotent)
- [ ] `GET /api/plans?date=2026-04-01` (Wednesday) normalizes to Monday 2026-03-30
- [ ] `POST /api/plans/{id}/transition` with `{"targetStatus": "LOCKED"}` transitions from DRAFT to LOCKED
- [ ] Invalid transitions return 409 with a descriptive error
- [ ] `GET /api/plans/{id}/transitions` returns the audit log
- [ ] Each transition creates a `plan_state_transition` record
- [ ] IC cannot access another IC's plan (403)

## Validation

- [ ] `cd backend && ./gradlew test` — all plan tests pass
- [ ] Manual: create plan, transition through DRAFT→LOCKED→RECONCILING, verify audit log

## Stop and Ask

- If optimistic locking via `@Version` causes issues with H2 in tests, ask before removing it — it may be needed for production concurrency safety.
