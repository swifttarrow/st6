# Task 005: Archive Safety Checks

## Purpose

Implement safety checks that prevent archiving or deleting RCDO hierarchy nodes when doing so would orphan active commitments. This fulfills the PRD requirement that "deleting or archiving a hierarchy node must not silently orphan existing commitments — the system must surface affected commitments and require resolution."

## Inputs

- Spec: `docs/specs/m1-data-foundation/README.md`
- Files: `backend/src/main/java/com/wct/rcdo/OutcomeService.java` (from Task 003)
- Files: `backend/src/main/java/com/wct/rcdo/DefiningObjectiveService.java` (from Task 003)
- Files: `backend/src/main/java/com/wct/rcdo/RallyCryService.java` (from Task 003)
- Files: Migration `V003__create_commitments.sql` (from Task 002) — defines the commitment table with `outcome_id` FK

## Outputs

- Modify: `backend/src/main/java/com/wct/rcdo/OutcomeService.java` — add archive safety check
- Modify: `backend/src/main/java/com/wct/rcdo/DefiningObjectiveService.java` — add cascade archive safety check
- Modify: `backend/src/main/java/com/wct/rcdo/RallyCryService.java` — add cascade archive safety check
- Create: `backend/src/main/java/com/wct/rcdo/dto/ArchiveConflictResponse.java` — response DTO for 409 conflicts
- Create: `backend/src/main/java/com/wct/commitment/repository/CommitmentRepository.java` — repository with query for active commitments by outcome
- Use: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` (created in Task 002)
- Use: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java` (created in Task 002)
- Create: `backend/src/test/java/com/wct/rcdo/ArchiveSafetyTest.java`
- Side effects: none

## Dependencies

- Prior task: `003-rcdo-crud-api.md`
- Required artifacts: RCDO service classes, RCDO entities, commitment table schema

## Constraints

- An "active commitment" is one whose `weekly_plan.status` is NOT `RECONCILED`. In other words, commitments in DRAFT, LOCKED, or RECONCILING plans are considered active.
- The safety check applies to the archive action (PATCH `/{id}/archive`). If active commitments exist, return HTTP 409 with details.
- Archiving a Defining Objective must check all Outcomes under it for active commitments.
- Archiving a Rally Cry must check all Outcomes under all its Defining Objectives for active commitments.
- If no active commitments reference the node (or its descendants), the archive proceeds normally.
- The 409 response must include the count of affected commitments and a list of affected weekly plan IDs (so the caller can inform users).

## Required Changes

### 1. Commitment Repository (using entities from Task 002)

The `Commitment` and `WeeklyPlan` JPA entities already exist from Task 002. This task creates only the `CommitmentRepository` with safety-check queries.

Create `CommitmentRepository` with a custom query:
```
findActiveCommitmentCountByOutcomeId(UUID outcomeId)
```
This counts commitments where `commitment.outcome_id = :outcomeId` AND the linked `weekly_plan.status` is in ('DRAFT', 'LOCKED', 'RECONCILING').

Also create:
```
findActiveCommitmentsByOutcomeIds(List<UUID> outcomeIds)
```
Returns a list of `{commitmentId, weeklyPlanId, outcomeId}` for display in the 409 response.

### 2. Archive Conflict Response DTO

```java
public record ArchiveConflictResponse(
    String message,
    int activeCommitmentCount,
    List<AffectedPlan> affectedPlans
) {
    public record AffectedPlan(UUID weeklyPlanId, String userId, LocalDate weekStartDate) {}
}
```

### 3. Modify Outcome Archive Logic

In `OutcomeService.archive(UUID outcomeId)`:
- Before setting `archived_at`, query `CommitmentRepository.findActiveCommitmentCountByOutcomeId(outcomeId)`
- If count > 0, return 409 with `ArchiveConflictResponse` listing affected plans
- If count == 0, proceed with archive

### 4. Modify Defining Objective Archive Logic

In `DefiningObjectiveService.archive(UUID doId)`:
- Fetch all Outcome IDs under this DO
- Query active commitments for all those Outcome IDs
- If any active commitments exist, return 409 with aggregated conflict details
- If none, archive the DO (do NOT cascade-archive child Outcomes — they become orphaned but accessible via direct ID for historical records)

### 5. Modify Rally Cry Archive Logic

In `RallyCryService.archive(UUID rcId)`:
- Fetch all DO IDs under this RC, then all Outcome IDs under those DOs
- Query active commitments for all those Outcome IDs
- If any active commitments exist, return 409 with aggregated conflict details
- If none, archive the RC

### 6. Tests

Write tests covering:
- Archiving an Outcome with no active commitments succeeds (200)
- Archiving an Outcome with active commitments returns 409 with correct count and plan details
- Archiving a DO with active commitments on a child Outcome returns 409
- Archiving a RC with active commitments on a grandchild Outcome returns 409
- After all plans referencing an Outcome are RECONCILED, archiving succeeds
- Archiving a Defining Objective does NOT cascade-archive its child Outcomes (children remain active and queryable)
- Archiving a Rally Cry does NOT cascade-archive its child DOs or grandchild Outcomes

## Acceptance Criteria

- [ ] `PATCH /api/rcdo/outcomes/{id}/archive` returns 409 when active commitments exist, with `activeCommitmentCount` and `affectedPlans` in response body
- [ ] `PATCH /api/rcdo/outcomes/{id}/archive` returns 200 when no active commitments reference the Outcome
- [ ] `PATCH /api/rcdo/defining-objectives/{id}/archive` returns 409 if any child Outcome has active commitments
- [ ] `PATCH /api/rcdo/rally-cries/{id}/archive` returns 409 if any grandchild Outcome has active commitments
- [ ] The 409 response body includes a human-readable message, count, and list of affected plans
- [ ] Commitments on RECONCILED plans do not block archiving
- [ ] Archiving a DO does NOT cascade-archive child Outcomes (they remain active)
- [ ] Archiving a RC does NOT cascade-archive child DOs or grandchild Outcomes

## Validation

- [ ] `cd backend && ./gradlew test` — all archive safety tests pass
- [ ] Manual test: create an Outcome, create a weekly plan + commitment referencing it, attempt archive, verify 409. Then reconcile the plan, attempt archive again, verify 200.

## Stop and Ask

- If the definition of "active commitment" should include additional states beyond DRAFT/LOCKED/RECONCILING, stop and ask before implementing.
