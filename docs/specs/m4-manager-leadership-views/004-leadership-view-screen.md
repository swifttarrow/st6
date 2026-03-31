# Task 004: Leadership View Screen

## Purpose

Implement the Leadership Organization Overview frontend screen showing cross-team RCDO hierarchy coverage with status indicators and gap alerts.

## Inputs

- Spec: `docs/specs/m4-manager-leadership-views/README.md`
- Spec: `docs/specs/m3-ic-frontend/README.md` (Design System section)
- Files: `frontend/src/api/dashboard.ts` (extend with leadership endpoint)
- Files: `frontend/src/components/StatCard/`, `frontend/src/components/WeekNavigator/` (from M4 Task 003)
- Design: `st6.pen` frame `8Simy` — Leadership View layout

## Outputs

- Create: `frontend/src/pages/LeadershipView/LeadershipViewPage.tsx`
- Create: `frontend/src/pages/LeadershipView/LeadershipViewPage.module.css`
- Create: `frontend/src/components/HierarchyCoverageTable/HierarchyCoverageTable.tsx`
- Create: `frontend/src/components/HierarchyCoverageTable/HierarchyCoverageTable.module.css`
- Create: `frontend/src/components/CoverageStatusBadge/CoverageStatusBadge.tsx`
- Create: `frontend/src/components/CoverageStatusBadge/CoverageStatusBadge.module.css`
- Create: `frontend/src/components/CoverageAlert/CoverageAlert.tsx`
- Create: `frontend/src/components/CoverageAlert/CoverageAlert.module.css`
- Modify: `frontend/src/api/dashboard.ts` — add leadership overview API function
- Modify: `frontend/src/api/types.ts` — add leadership response types
- Modify: `frontend/src/router.tsx` — replace /leadership placeholder
- Create: `frontend/src/__tests__/pages/LeadershipViewPage.test.tsx`
- Side effects: none

## Dependencies

- Prior task: `002-leadership-overview-api.md` (backend), `003-manager-dashboard-screen.md` (shared components)
- Required artifacts: API client, StatCard, WeekNavigator, Shell, PageHeader, design tokens

## Constraints

- Only accessible to LEADERSHIP role. Manager and IC are redirected.
- Entirely read-only. No mutations from this screen.
- The hierarchy table shows Rally Cries as parent rows and Defining Objectives as indented child rows. Outcomes are not shown (too granular).

## Required Changes

### 1. Leadership API Client

Add to `frontend/src/api/dashboard.ts`:
- `getOrgOverview(date: string): Promise<OrgOverviewResponse>`
- Add corresponding types to `types.ts`

### 2. LeadershipViewPage

`LeadershipViewPage.tsx`:
- On mount, fetch org overview for current week
- Render:
  - `PageHeader` with "Organization Overview" title + subtitle "Cross-team strategic alignment — Week of {date}"
  - `WeekNavigator` in header right area
  - Stats row: 4 `StatCard` components
  - `HierarchyCoverageTable` (full width)

Stats row:
- Total Teams: `stats.totalTeams` (black)
- Active Rally Cries: `stats.activeRallyCries` (black)
- Org Commitments: `stats.orgCommitments` (black)
- Coverage Gaps: `stats.coverageGaps` (red if > 0, black if 0)

### 3. Hierarchy Coverage Table

`HierarchyCoverageTable.tsx`:
- Props: `hierarchy: RcdoHierarchyCoverage[]`, `totalTeams: number`
- Header: "Strategic Hierarchy Coverage" + "Read-only" hint text, #FAFAFA background, 14px/20px padding, 1px bottom border
- Column headers: Rally Cry / Defining Objective, Teams, Commitments, Coverage, Status
- Column widths per design: Name (flex), Teams (100px), Commitments (120px), Coverage (120px), Status (100px)
- Column header: 12px/20px padding, Inter 12px grey text

**Rally Cry rows (parent level):**
- #FAFAFA background, 14px/20px padding, 1px bottom border
- Name: Space Grotesk 13px semibold
- Teams: "{teamCount} / {totalTeams}" (Inter 13px)
- Commitments: count (Inter 13px)
- Coverage: "{coveragePercent}%" (Inter 13px)
- Status: `CoverageStatusBadge`
- If status is ALERT: row has #FEF2F2 background instead of #FAFAFA

**Defining Objective rows (child level):**
- Default background, 12px top/bottom + 20px right + 40px left padding (indented)
- Name: Inter 13px regular
- Same columns but at DO-level aggregation

**Alert rows:**
- When a Rally Cry has `consecutiveZeroWeeks >= 3`, render a `CoverageAlert` row immediately below it
- Full width, #FEF2F2 background, 10px/20px padding (40px left indent)

### 4. CoverageStatusBadge

`CoverageStatusBadge.tsx`:
- Props: `status: 'ON_TRACK' | 'AT_RISK' | 'ALERT'`
- ON_TRACK: green background, white text, "On Track"
- AT_RISK: amber/yellow background, dark text, "At Risk"
- ALERT: red background, white text, "Alert"
- Compact pill: Inter 12px weight 500, rounded corners, padding 4px 8px

### 5. CoverageAlert

`CoverageAlert.tsx`:
- Props: `message: string`
- Red info icon (Lucide `info`, 14px, #E42313) + message text (Inter 12px, #E42313)
- Row: #FEF2F2 background, 8px gap between icon and text
- Matches the warning row in frame `8Simy` for RC#3

### 6. Router Update

Replace `/leadership` placeholder with `LeadershipViewPage`. Add role guard: redirect non-LEADERSHIP users.

## Acceptance Criteria

- [ ] Page loads and shows stats row with Total Teams, Active Rally Cries, Org Commitments, Coverage Gaps
- [ ] Coverage Gaps stat is red when > 0
- [ ] Hierarchy table shows Rally Cries as parent rows with Defining Objectives indented beneath
- [ ] Each row shows Teams, Commitments, Coverage %, and Status badge
- [ ] ON_TRACK / AT_RISK / ALERT badges display with correct colors and thresholds
- [ ] Alert Rally Cries (0% coverage) have red-tinted row background
- [ ] Warning note row appears for Rally Cries with >= 3 consecutive zero-coverage weeks
- [ ] Week navigation allows browsing previous weeks
- [ ] Non-LEADERSHIP roles are redirected
- [ ] Entirely read-only — no mutation actions
- [ ] Styling matches `st6.pen` frame `8Simy`

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — leadership view tests pass
- [ ] Visual comparison with `st6.pen` frame `8Simy` screenshot

## Stop and Ask

- If Leadership should also be able to filter by specific teams or Rally Cries, ask before adding filter controls (not in current design).
