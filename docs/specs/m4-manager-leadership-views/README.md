# Milestone 4: Manager & Leadership Views

## Outcome

A complete manager dashboard and leadership organization overview. After this milestone, managers can view their team's weekly plans in aggregate, see alignment coverage against Rally Cries, drill into individual IC plans, and unlock locked plans. Leadership can view cross-team roll-ups of commitment coverage against the full RCDO hierarchy, with visual alerts for coverage gaps.

## Scope

- Manager dashboard backend API (team roll-up, alignment aggregation)
- Leadership overview backend API (cross-team roll-up, coverage metrics)
- Manager Dashboard frontend screen (design: `st6.pen` frame `2PL2M`)
- Leadership View frontend screen (design: `st6.pen` frame `8Simy`)
- Manager unlock integration in the dashboard (button on locked plans)

## Out of Scope

- Historical trend analytics and charting (deferred per PRD)
- Notifications and reminders (deferred)
- RCDO hierarchy management UI (managers/leaders manage hierarchy via API; a dedicated management screen is a follow-up)

## Source Inputs

- PRD: `docs/prd.md` (sections: Manager Dashboard, Leadership View, Manager Unlock)
- Spec: `docs/specs/m1-data-foundation/README.md`, `docs/specs/m2-weekly-lifecycle/README.md`
- Design: `st6.pen` frames `2PL2M` (Manager Dashboard), `8Simy` (Leadership View)

## Constraints

- Manager can only see their direct reports' data. The manager→IC relationship comes from host app context.
- Leadership can see all teams' data (read-only).
- All views are read-only except the manager unlock action.
- The backend APIs for aggregation must be efficient — avoid N+1 queries for team roll-ups.

## Decisions

- For first release, manager→IC relationships are derived from the `X-Manager-Id` / `X-Team-Id` headers. The backend trusts the `memberIds` parameter from the manager; production hardening against an org-chart API is a follow-up.
- Coverage percentage = (teams with at least one commitment for a node) / (total teams). "On Track": >= 50%. "At Risk": > 0% and < 50%. "Alert": 0%.
- Consecutive-zero-coverage: the backend looks back up to 10 prior weeks counting consecutive weeks with zero commitments. The frontend alert threshold is >= 3 consecutive zero weeks.
- `avgCompletionRate` is computed only from RECONCILED plans; non-reconciled members are excluded (not counted as 0).
- `team_id` column on `weekly_plan` exists from M1 Task 002 — no additional migration needed in M4.

## Assumptions

- The host app context can provide a list of direct-report user IDs for the manager (or the manager can query for plans by team ID). The exact mechanism is the pluggable `UserContext` approach from M1.
- For leadership, "all teams" means all distinct `team_id` values in the weekly_plan table. There is no separate team registry in this module.

## Task Order

1. `001-manager-dashboard-api.md` — Backend endpoints for team roll-up data. Frontend depends on this.
2. `002-leadership-overview-api.md` — Backend endpoints for cross-team coverage. Frontend depends on this.
3. `003-manager-dashboard-screen.md` — Manager Dashboard frontend.
4. `004-leadership-view-screen.md` — Leadership View frontend.

## Milestone Success Criteria

- Manager dashboard shows each direct report's plan status, commitment count, and top Rally Cry
- Alignment coverage panel shows commitment distribution across Rally Cries with gap alerts
- Manager can click "Unlock" on a locked IC plan
- Leadership view shows cross-team RCDO coverage with On Track / At Risk / Alert status
- Coverage gaps (especially 0%) are visually highlighted
- Multi-week zero-coverage warning appears for flagged Rally Cries

## Milestone Validation

- `cd backend && ./gradlew test` — all dashboard and leadership API tests pass
- `cd frontend && npm run build && npm test` — all dashboard component tests pass
- Visual comparison against `st6.pen` frames `2PL2M` and `8Simy`
- Manual: log in as manager → view dashboard → unlock a plan → log in as leadership → view overview

## Risks / Follow-ups

- Team member list: if the host app doesn't provide direct-report IDs in the context, the manager dashboard will need a separate team-members API or configuration. This is the biggest integration risk in the module.
- Performance: leadership view queries across all teams and all weeks. With a small org (<500 users), this is fine. At scale, it may need caching or pre-aggregation.
