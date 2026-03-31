# Task 003: Manager Dashboard Screen

## Purpose

Implement the Manager Dashboard frontend screen showing team-level weekly plan status, commitment counts, and Rally Cry alignment coverage with drill-down and unlock capabilities.

## Inputs

- Spec: `docs/specs/m4-manager-leadership-views/README.md`
- Spec: `docs/specs/m3-ic-frontend/README.md` (Design System section)
- Files: `frontend/src/api/` (from M3 Task 002 — extend with dashboard endpoints)
- Files: `frontend/src/components/` (Shell, PageHeader, Badge, StatsBar from M3)
- Design: `st6.pen` frame `2PL2M` — Manager Dashboard layout

## Outputs

- Create: `frontend/src/pages/ManagerDashboard/ManagerDashboardPage.tsx`
- Create: `frontend/src/pages/ManagerDashboard/ManagerDashboardPage.module.css`
- Create: `frontend/src/components/TeamMembersTable/TeamMembersTable.tsx`
- Create: `frontend/src/components/TeamMembersTable/TeamMembersTable.module.css`
- Create: `frontend/src/components/CoveragePanel/CoveragePanel.tsx`
- Create: `frontend/src/components/CoveragePanel/CoveragePanel.module.css`
- Create: `frontend/src/components/WeekNavigator/WeekNavigator.tsx`
- Create: `frontend/src/components/WeekNavigator/WeekNavigator.module.css`
- Create: `frontend/src/components/StatCard/StatCard.tsx`
- Create: `frontend/src/components/StatCard/StatCard.module.css`
- Modify: `frontend/src/api/dashboard.ts` — add manager dashboard API functions
- Modify: `frontend/src/api/types.ts` — add dashboard response types
- Modify: `frontend/src/router.tsx` — replace /team placeholder
- Create: `frontend/src/__tests__/pages/ManagerDashboardPage.test.tsx`
- Side effects: none

## Dependencies

- Prior task: `001-manager-dashboard-api.md` (backend must exist)
- Required artifacts: API client base, Shell, PageHeader, Badge, design tokens

## Constraints

- Only accessible to MANAGER and LEADERSHIP roles. IC users are redirected.
- Manager sees only their direct reports. The member ID list comes from the host app context.
- All views except unlock are read-only.
- Week navigation allows browsing previous weeks but not future weeks beyond the current one.

## Required Changes

### 1. Dashboard API Client

Add to `frontend/src/api/dashboard.ts`:
- `getTeamOverview(date: string, memberIds: string[]): Promise<TeamOverviewResponse>` — calls `GET /api/dashboard/team?date=...&memberIds=user1&memberIds=user2` (repeated params)
- Add corresponding types (`TeamOverviewResponse`, `TeamMemberSummary`, `RallyCryCoverage`) to `types.ts`

### 2. ManagerDashboardPage

`ManagerDashboardPage.tsx`:
- On mount, fetch team overview for current week
- Render:
  - `PageHeader` with "Team Dashboard" title + subtitle "Week of {Mon} – {Fri}, {Year}"
  - `WeekNavigator` in header right area
  - Stats row: 4 `StatCard` components
  - Bottom section: `TeamMembersTable` (left, flex: 1) + `CoveragePanel` (right, 360px fixed)

### 3. StatCard Component

`StatCard.tsx`:
- Props: `label: string`, `value: string | number`, `valueColor?: string`
- Layout per design: vertical stack, label on top (Inter 13px grey), value below (Space Grotesk 36px semibold, letter-spacing -1px)
- Container: 28px padding, 1px border, flex: 1 (equal width in row)
- Value color: default #0D0D0D, can be overridden (green for positive metrics)

Stats row displays:
- Direct Reports: `stats.directReports` (black)
- Plans Locked: `stats.plansLocked / stats.directReports` (green)
- Total Commitments: `stats.totalCommitments` (black)
- Avg Completion: `stats.avgCompletionRate` as percentage (green)

### 4. WeekNavigator

`WeekNavigator.tsx`:
- Props: `currentDate: string`, `onWeekChange: (date: string) => void`
- Left chevron (previous week), "This Week" label (or formatted date), right chevron (next week)
- Right chevron disabled when viewing current week
- Clicking chevrons adjusts the date by +/- 7 days and triggers `onWeekChange`
- Styling: Lucide chevron icons (16px, grey), Inter 13px medium text

### 5. Team Members Table

`TeamMembersTable.tsx`:
- Props: `members: TeamMemberSummary[]`, `onViewPlan: (planId) => void`, `onUnlock: (planId) => void`
- Header: "Team Members" with member count badge, #FAFAFA background
- Column headers: Member, Status, Commits, Top Rally Cry
- Table header row: 12px/20px padding, Inter 12px grey text, 1px bottom border

Per member row (16px/20px padding, 1px bottom border):
- **Member**: Avatar circle (colored, 32px) + name (Inter 13px medium). Avatar color derived from name hash.
- **Status**: Badge showing plan status with color coding:
  - LOCKED: green badge
  - DRAFT: grey/default badge
  - RECONCILING: yellow/amber badge
  - RECONCILED: green filled badge
  - No plan: "No Plan" in grey
- **Commits**: count number (Inter 13px)
- **Top Rally Cry**: Rally Cry name (Inter 12px grey), e.g., "RC #1 (5/7)"

Row actions:
- Click row → drill into IC's plan (read-only, using existing plan view)
- If status is LOCKED: show small "Unlock" button/link. On click, call `api.plans.unlockPlan(planId)`, refresh data.

### 6. Coverage Panel

`CoveragePanel.tsx`:
- Props: `coverage: RallyCryCoverage[]`
- Header: "Rally Cry Coverage" with #FAFAFA background, 14px/20px padding
- Per Rally Cry:
  - Name (Inter 13px medium/semibold)
  - Commitment count badge (e.g., "16 commits")
  - Color coding: green for healthy (>0), red background (#FEF2F2) for zero coverage
- Zero-coverage items show alert styling with red text and warning note if `consecutiveZeroWeeks >= 3`:
  - Red info icon + "No coverage - {N} week running" (Inter 12px red)
- Fixed width: 360px per design

### 7. Router Update

Replace `/team` placeholder with `ManagerDashboardPage`. Add role guard to redirect IC users.

## Acceptance Criteria

- [ ] Dashboard loads and shows stats row with correct values
- [ ] Team Members table lists all direct reports with status, commit count, and top Rally Cry
- [ ] Clicking a row navigates to a read-only view of that IC's plan
- [ ] Unlock button appears on LOCKED plans and successfully transitions to DRAFT
- [ ] Coverage panel shows all active Rally Cries with commitment counts
- [ ] Zero-coverage Rally Cries have alert styling
- [ ] Multi-week zero-coverage warning appears with correct week count
- [ ] Week navigation allows browsing previous weeks
- [ ] IC role is redirected away from this page
- [ ] Styling matches `st6.pen` frame `2PL2M`

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — dashboard component tests pass
- [ ] Visual comparison with `st6.pen` frame `2PL2M` screenshot

## Stop and Ask

- If drill-down into an IC's plan should open in a modal/side panel rather than navigating to a new page, ask for clarification on the UX pattern.
