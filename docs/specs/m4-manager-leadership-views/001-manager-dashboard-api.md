# Task 001: Manager Dashboard API

## Purpose

Implement the backend endpoints that power the Manager Dashboard. These provide team-level aggregation of weekly plan status, commitment counts, and Rally Cry alignment coverage for a manager's direct reports.

## Inputs

- Spec: `docs/specs/m4-manager-leadership-views/README.md`
- Files: `backend/src/main/java/com/wct/plan/entity/WeeklyPlan.java` (from M2)
- Files: `backend/src/main/java/com/wct/commitment/entity/Commitment.java` (from M2)
- Files: `backend/src/main/java/com/wct/rcdo/entity/` (from M1)
- Files: `backend/src/main/java/com/wct/auth/UserContext.java` (from M1)
- Design reference: `st6.pen` frame `2PL2M` — data displayed in stats row, team table, and coverage panel

## Outputs

- Create: `backend/src/main/java/com/wct/dashboard/ManagerDashboardController.java`
- Create: `backend/src/main/java/com/wct/dashboard/ManagerDashboardService.java`
- Create: `backend/src/main/java/com/wct/dashboard/dto/TeamOverviewResponse.java`
- Create: `backend/src/main/java/com/wct/dashboard/dto/TeamMemberSummary.java`
- Create: `backend/src/main/java/com/wct/dashboard/dto/RallyCryCoverage.java`
- Create: `backend/src/test/java/com/wct/dashboard/ManagerDashboardControllerTest.java`
- Side effects: none

## Dependencies

- Prior task: none (within M4), but requires M1 and M2 fully completed
- Required artifacts: WeeklyPlan, Commitment, RCDO entities and repositories

## Constraints

- Only users with MANAGER or LEADERSHIP role can access these endpoints. IC returns 403.
- The endpoint accepts a list of direct-report user IDs as repeated query parameters: `?memberIds=user-1&memberIds=user-2` (Spring's default `@RequestParam List<String>` binding).
- **Authorization**: For first release, the backend trusts the `memberIds` parameter. The host app is responsible for limiting which ICs a manager can query. Production hardening (validating against an org-chart API) is a follow-up.
- All queries are for a specific week (identified by date, normalized to Monday).
- Aggregation queries must be efficient — use SQL joins and GROUP BY, not in-memory aggregation over individual plans.

## Required Changes

### 1. Team Overview Endpoint

`GET /api/dashboard/team?date={yyyy-MM-dd}&memberIds=user-1&memberIds=user-2`

Returns:

```json
{
  "weekStartDate": "2026-03-30",
  "stats": {
    "directReports": 8,
    "plansLocked": 6,
    "totalCommitments": 34,
    "avgCompletionRate": 0.78
  },
  "members": [
    {
      "userId": "user-1",
      "userName": "Alex Kim",
      "planId": "uuid",
      "planStatus": "LOCKED",
      "commitmentCount": 5,
      "topRallyCry": "RC #1: Revenue Growth",
      "completionRate": 0.80
    }
  ],
  "rallyCryCoverage": [
    {
      "rallyCryId": "uuid",
      "rallyCryName": "RC #1: Revenue Growth",
      "commitmentCount": 16,
      "memberCount": 5,
      "consecutiveZeroWeeks": 0
    },
    {
      "rallyCryId": "uuid",
      "rallyCryName": "RC #3: Expand APAC",
      "commitmentCount": 0,
      "memberCount": 0,
      "consecutiveZeroWeeks": 3
    }
  ]
}
```

### 2. Service Logic

`ManagerDashboardService.getTeamOverview(List<String> memberIds, LocalDate date)`:

**Stats calculation:**
- `directReports`: count of memberIds
- `plansLocked`: count of plans with status in (LOCKED, RECONCILING, RECONCILED) for the given week
- `totalCommitments`: sum of all commitments across all members' plans for the week
- `avgCompletionRate`: computed ONLY from members who have RECONCILED plans for this week. Formula: average of each member's (COMPLETED commitments / total commitments). Members without a RECONCILED plan are excluded from the average (not counted as 0). If no members have reconciled, the value is `null`.

  **Example**: Team of 8 members. Alice reconciled: 8/10 completed = 0.80. Carol reconciled: 6/8 = 0.75. Remaining 6 members have not reconciled. `avgCompletionRate = (0.80 + 0.75) / 2 = 0.775` (77.5%). The 6 non-reconciled members are excluded.

**Member summaries:**
- For each member, join weekly_plan and commitment tables
- `topRallyCry`: the Rally Cry with the most commitments for that member that week (via join commitment → outcome → defining_objective → rally_cry, then GROUP BY rally_cry)
- `completionRate`: for RECONCILED plans, (COMPLETED count / total count). Null for non-reconciled plans.

**Rally Cry coverage:**
- For all active Rally Cries, count distinct members and total commitments across the team for the given week
- `consecutiveZeroWeeks`: Starting from the week BEFORE the queried week, count consecutive prior weeks where this Rally Cry had zero commitments from this team. Stop counting when a non-zero week is found or after 10 weeks of lookback (performance cap). This is the lookback window; the frontend decides the alert threshold (>= 3 weeks shows a warning).

### 3. Individual Plan Drill-Down

`GET /api/dashboard/team/plans/{planId}`

Returns the full plan with commitments (read-only). Same as `GET /api/plans/{planId}` but accessible by the manager role when the plan belongs to a direct report. Reuse the existing plan endpoint with manager-read authorization from M2 Task 001.

### 4. Efficient Queries

Create custom repository queries (JPQL or native SQL):

```sql
-- Member summaries for a week
SELECT wp.user_id, wp.status, COUNT(c.id) as commitment_count
FROM weekly_plan wp
LEFT JOIN commitment c ON c.weekly_plan_id = wp.id
WHERE wp.user_id IN (:memberIds) AND wp.week_start_date = :weekStart
GROUP BY wp.user_id, wp.status;

-- Rally Cry coverage for a team
SELECT rc.id, rc.name, COUNT(DISTINCT wp.user_id) as member_count, COUNT(c.id) as commitment_count
FROM rally_cry rc
LEFT JOIN defining_objective do ON do.rally_cry_id = rc.id
LEFT JOIN outcome o ON o.defining_objective_id = do.id
LEFT JOIN commitment c ON c.outcome_id = o.id
LEFT JOIN weekly_plan wp ON wp.id = c.weekly_plan_id AND wp.week_start_date = :weekStart AND wp.user_id IN (:memberIds)
WHERE rc.archived_at IS NULL
GROUP BY rc.id, rc.name;
```

### 5. Tests

- Manager with valid memberIds gets correct team overview
- Stats are computed correctly (plansLocked count, totalCommitments sum, avgCompletionRate)
- Member summaries show correct plan status, commitment count, and top Rally Cry
- Rally Cry coverage shows correct member count and commitment count
- Consecutive zero weeks are computed correctly
- IC calling the endpoint returns 403
- Empty team (no plans for the week) returns zeroed stats

## Acceptance Criteria

- [ ] `GET /api/dashboard/team` returns stats, member summaries, and Rally Cry coverage
- [ ] Stats match the expected values from the test data
- [ ] Top Rally Cry per member is correctly computed
- [ ] Rally Cry coverage includes all active Rally Cries, including those with zero commitments
- [ ] `consecutiveZeroWeeks` correctly counts back through prior weeks
- [ ] IC role returns 403
- [ ] Queries use joins and aggregations, not N+1 patterns

## Validation

- [ ] `cd backend && ./gradlew test` — all dashboard tests pass
- [ ] Manual: create plans for multiple users → query dashboard → verify stats match

## Stop and Ask

- If the host app provides a team-members API that should be called instead of accepting memberIds as a parameter, stop and ask about the integration contract.
