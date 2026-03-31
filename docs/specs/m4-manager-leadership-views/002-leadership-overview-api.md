# Task 002: Leadership Overview API

## Purpose

Implement the backend endpoint that powers the Leadership Organization Overview. This provides cross-team roll-up of commitment coverage against the full RCDO hierarchy, with coverage percentages and gap detection.

## Inputs

- Spec: `docs/specs/m4-manager-leadership-views/README.md`
- Files: All M1 entity/repository classes, M2 plan/commitment entities
- Design reference: `st6.pen` frame `8Simy` — data displayed in stats row and RCDO breakdown table

## Outputs

- Create: `backend/src/main/java/com/wct/dashboard/controller/LeadershipOverviewController.java`
- Create: `backend/src/main/java/com/wct/dashboard/service/LeadershipOverviewService.java`
- Create: `backend/src/main/java/com/wct/dashboard/dto/OrgOverviewResponse.java`
- Create: `backend/src/main/java/com/wct/dashboard/dto/RcdoHierarchyCoverage.java`
- Create: `backend/src/test/java/com/wct/dashboard/LeadershipOverviewControllerTest.java`
- Side effects: none

## Dependencies

- Prior task: `001-manager-dashboard-api.md` (shares dashboard package and patterns)
- Required artifacts: RCDO entities, WeeklyPlan, Commitment entities

## Constraints

- Only LEADERSHIP role can access. MANAGER and IC return 403.
- "Teams" are distinct `team_id` values found in weekly plans for the queried week. There is no separate team registry.
- Coverage % = (distinct teams with at least one commitment for this node) / (total distinct teams for the week) * 100
- Status thresholds: "On Track" >= 50%, "At Risk" > 0% and < 50%, "Alert" = 0%
- Consecutive-zero-weeks detection: for each Rally Cry, count consecutive prior weeks (up to 10 lookback) with zero commitments org-wide.

## Required Changes

### 1. Organization Overview Endpoint

`GET /api/dashboard/leadership?date={yyyy-MM-dd}`

Returns:

```json
{
  "weekStartDate": "2026-03-30",
  "stats": {
    "totalTeams": 12,
    "activeRallyCries": 4,
    "orgCommitments": 142,
    "coverageGaps": 1
  },
  "hierarchy": [
    {
      "type": "RALLY_CRY",
      "id": "uuid",
      "name": "RC #1: Revenue Growth",
      "teamCount": 8,
      "totalTeams": 12,
      "commitmentCount": 62,
      "coveragePercent": 67,
      "status": "ON_TRACK",
      "consecutiveZeroWeeks": 0,
      "warningNote": null,
      "children": [
        {
          "type": "DEFINING_OBJECTIVE",
          "id": "uuid",
          "name": "DO: Increase Enterprise Pipeline",
          "teamCount": 5,
          "totalTeams": 12,
          "commitmentCount": 36,
          "coveragePercent": 42,
          "status": "AT_RISK"
        }
      ]
    },
    {
      "type": "RALLY_CRY",
      "id": "uuid",
      "name": "RC #3: Expand into APAC",
      "teamCount": 0,
      "totalTeams": 12,
      "commitmentCount": 0,
      "coveragePercent": 0,
      "status": "ALERT",
      "consecutiveZeroWeeks": 3,
      "warningNote": "Zero commitments for 3 consecutive weeks. Board-level priority this quarter."
    }
  ]
}
```

### 2. Service Logic

`LeadershipOverviewService.getOrgOverview(LocalDate date)`:

**Total teams:** `SELECT COUNT(DISTINCT team_id) FROM weekly_plan WHERE week_start_date = :weekStart`

The `team_id` column already exists on `weekly_plan` — it was added in M1 Task 002's migration V002 and is populated from `UserContext.teamId` when a plan is created (per M2 Task 001). No additional migration is needed.

**Stats:**
- `totalTeams`: distinct team_ids with plans this week
- `activeRallyCries`: count of non-archived Rally Cries
- `orgCommitments`: total commitments across all plans for the week
- `coverageGaps`: count of Rally Cries with 0 commitments

**Hierarchy coverage:**
- For each active Rally Cry, compute team count, commitment count, coverage %
- For each Defining Objective under it, compute the same
- Outcomes are not shown in the leadership view (too granular) — aggregate at DO level
- Status: ON_TRACK if coverage >= 50%, AT_RISK if > 0% and < 50%, ALERT if 0%
- `consecutiveZeroWeeks`: Starting from the week BEFORE the queried week, count consecutive prior weeks where this Rally Cry had zero commitments org-wide. Stop counting at the first non-zero week or after 10 weeks lookback. The alert threshold (>= 3 weeks triggers a warning) is applied in the response formatting, not in the query.

**Efficient query pattern:**

```sql
-- RC-level coverage
SELECT rc.id, rc.name,
  COUNT(DISTINCT wp.team_id) as team_count,
  COUNT(c.id) as commitment_count
FROM rally_cry rc
LEFT JOIN defining_objective do ON do.rally_cry_id = rc.id AND do.archived_at IS NULL
LEFT JOIN outcome o ON o.defining_objective_id = do.id AND o.archived_at IS NULL
LEFT JOIN commitment c ON c.outcome_id = o.id
LEFT JOIN weekly_plan wp ON wp.id = c.weekly_plan_id AND wp.week_start_date = :weekStart
WHERE rc.archived_at IS NULL
GROUP BY rc.id, rc.name, rc.sort_order
ORDER BY rc.sort_order;
```

Similar query at DO level with `GROUP BY do.id`.

### 3. Warning Notes

For Rally Cries with `consecutiveZeroWeeks >= 3`, auto-generate a warning note:
"Zero commitments for {N} consecutive weeks."

This matches the design in frame `8Simy` where RC#3 shows an alert row with info icon and warning text.

### 4. Tests (no migration needed — team_id already exists from M1 Task 002)

- Leadership role gets full overview with stats and hierarchy
- Coverage percentages are computed correctly
- Status thresholds: ON_TRACK, AT_RISK, ALERT assigned correctly
- Consecutive zero weeks counted correctly
- Warning note generated for Rally Cries with >= 3 consecutive zero weeks
- Manager role returns 403
- IC role returns 403
- Empty org (no plans) returns zeroed stats

## Acceptance Criteria

- [ ] `GET /api/dashboard/leadership` returns stats, hierarchy coverage, and status indicators
- [ ] Coverage % = (teams with commitments / total teams) * 100
- [ ] Status: ON_TRACK >= 50%, AT_RISK > 0% and < 50%, ALERT = 0%
- [ ] Hierarchy shows Rally Cries with nested Defining Objectives
- [ ] `consecutiveZeroWeeks` is correctly computed
- [ ] Warning notes appear for Rally Cries with >= 3 consecutive zero-coverage weeks
- [ ] `coverageGaps` stat counts Rally Cries with 0% coverage
- [ ] `team_id` column on `weekly_plan` is used for team aggregation (exists from M1 Task 002 migration)
- [ ] Non-LEADERSHIP roles return 403

## Validation

- [ ] `cd backend && ./gradlew test` — all leadership overview tests pass
- [ ] Manual: create plans across multiple teams → query leadership endpoint → verify coverage calculations

## Stop and Ask

- If team_id should come from a different source than the UserContext header (e.g., looked up from an org-chart service), stop and ask about the integration.
