# Task 003: Weekly Planning Screen

## Purpose

Implement the IC Weekly Planning screen — the primary screen where ICs create, link, prioritize, and lock their weekly commitments. This is the most feature-rich screen in the application.

## Inputs

- Spec: `docs/specs/m3-ic-frontend/README.md` (Design System section)
- Files: `frontend/src/api/` (from Task 002)
- Files: `frontend/src/components/Shell/`, `frontend/src/components/PageHeader/`, `frontend/src/components/Badge/` (from Task 001)
- Design: `st6.pen` frame `K3Xao` — IC Weekly Planning layout

## Outputs

- Create: `frontend/src/pages/WeeklyPlanning/WeeklyPlanningPage.tsx`
- Create: `frontend/src/pages/WeeklyPlanning/WeeklyPlanningPage.module.css`
- Create: `frontend/src/components/StrategyBrowser/StrategyBrowser.tsx` — RCDO tree panel
- Create: `frontend/src/components/StrategyBrowser/StrategyBrowser.module.css`
- Create: `frontend/src/components/CommitmentList/CommitmentList.tsx` — commitment table
- Create: `frontend/src/components/CommitmentList/CommitmentList.module.css`
- Create: `frontend/src/components/CommitmentRow/CommitmentRow.tsx` — single commitment row
- Create: `frontend/src/components/CommitmentRow/CommitmentRow.module.css`
- Create: `frontend/src/components/CommitmentForm/CommitmentForm.tsx` — add/edit commitment modal or inline form
- Create: `frontend/src/components/CommitmentForm/CommitmentForm.module.css`
- Create: `frontend/src/components/ActionBar/ActionBar.tsx` — lock plan + add commitment buttons
- Create: `frontend/src/components/ActionBar/ActionBar.module.css`
- Create: `frontend/src/__tests__/pages/WeeklyPlanningPage.test.tsx`
- Modify: `frontend/src/router.tsx` — replace placeholder with WeeklyPlanningPage
- Side effects: none

## Dependencies

- Prior task: `002-api-client.md`
- Required artifacts: API client functions, Shell/PageHeader/Badge components, UserContext

## Constraints

- Layout must match `st6.pen` frame `K3Xao`: two-column body with Strategy Browser (320px fixed) on left and Commitments List (flex: 1) on right, separated by 32px gap.
- All styling via CSS custom properties from `tokens.css`.
- Commitment mutations (add, edit, delete, reorder) only enabled when plan is DRAFT. In LOCKED/RECONCILING/RECONCILED states, the list is read-only.
- The Strategy Browser is always visible for reference but linking is only interactive in DRAFT.

## Required Changes

### 1. WeeklyPlanningPage

`WeeklyPlanningPage.tsx`:
- On mount, fetch the current week's plan via `api.plans.getPlan(todayDate)`
- Fetch commitments via `api.commitments.listCommitments(plan.id)`
- Fetch RCDO tree via `api.rcdo.getTree()`
- Render:
  - `PageHeader` with title "My Week — {formatted date}" and status Badge (DRAFT/LOCKED/etc.)
  - `ActionBar` with Lock Plan and Add Commitment buttons (only visible in DRAFT)
  - Body row: `StrategyBrowser` (left) + `CommitmentList` (right)

### 2. Strategy Browser

`StrategyBrowser.tsx`:
- Props: `tree: RcdoTreeRallyCry[]`, `onSelectOutcome?: (outcome: RcdoTreeOutcome) => void`, `interactive: boolean`
- Displays "Strategy Hierarchy" heading + "Link commitments to outcomes" subtext
- Renders collapsible tree: Rally Cry > Defining Objective > Outcome
- Rally Cry rows: red left border accent, bold name, collapse/expand toggle
- Defining Objective rows: indented, with dot indicator
- Outcome rows: further indented, leaf nodes
- Styling per design: tree items with indentation using padding-left (16px per level)
- When `interactive` is true and an Outcome is clicked, call `onSelectOutcome`
- Search/filter field at top for quick filtering by name (client-side filter of the loaded tree):
  - Filters in real-time as the user types (debounce 300ms)
  - Matches Outcome names only; parent Rally Cries and Defining Objectives are shown if they contain matching Outcomes
  - Case-insensitive substring match
  - If no Outcomes match, show "No outcomes found" message in the tree area
  - Search input: Inter 13px, 1px border (#E8E8E8), 8px/12px padding, placeholder "Search outcomes..."

### 3. Commitment List

`CommitmentList.tsx`:
- Props: `commitments: Commitment[]`, `planStatus: PlanStatus`, `onEdit`, `onDelete`, `onReorder`
- Header row: #, Commitment, Linked Outcome, Actions
- Header row has grey background (#FAFAFA), 14px/20px padding, Inter 12px weight 500 grey text
- Render `CommitmentRow` for each commitment ordered by priority
- When DRAFT: show edit (pencil) and delete (trash) icons in Actions column
- When not DRAFT: hide action icons
- Support drag-and-drop reordering in DRAFT state using `@dnd-kit/core` and `@dnd-kit/sortable`. On drop, call `onReorder` with new ordered ID list. If dnd-kit conflicts with the host app's dependencies, fall back to up/down arrow buttons on each row.

### 4. Commitment Row

`CommitmentRow.tsx`:
- Props: `commitment: Commitment`, `rank: number`, `planStatus`, `onEdit`, `onDelete`
- Columns:
  - Rank number (Space Grotesk 14px semibold)
  - Description (Inter 13px medium) with optional subtitle showing notes in grey
  - Linked Outcome path: "RC > DO > Outcome" (Inter 12px grey)
  - Action icons (edit, delete) — only in DRAFT
- Row: 16px/20px padding, 1px bottom border, hover highlight
- If `commitment.outcomeArchived`, show warning indicator (yellow/red background)
- If `commitment.carriedForward`, show a subtle "carried forward" indicator

### 5. Commitment Form

`CommitmentForm.tsx`:
- Props: `mode: 'create' | 'edit'`, `commitment?: Commitment`, `tree: RcdoTreeNode[]`, `onSubmit`, `onCancel`
- Fields:
  - Description (required text input)
  - Linked Outcome (searchable dropdown/tree selector using the RCDO tree)
  - Notes (optional textarea)
- On submit: calls `onSubmit` with `{ description, outcomeId, notes }`
- Validation: description required, outcome required
- Can be a modal overlay or inline panel — modal preferred per common patterns

### 6. Action Bar

`ActionBar.tsx`:
- Props: `planStatus: PlanStatus`, `onLock`, `onAddCommitment`, `onStartReconciliation`
- DRAFT state: show "Lock Plan" button (outline, with lock icon) + "Add Commitment" button (red filled, with plus icon)
- LOCKED state: show "Begin Reconciliation" button (navigates to reconciliation page)
- RECONCILING/RECONCILED: no action buttons (or "View Reconciliation" link)
- Button styles per design: outline buttons have 1px border #E8E8E8, 10px/20px padding. Filled buttons are #E42313 with white text.

### 7. Lock Plan Flow

When IC clicks "Lock Plan":
- Show confirmation (optional but recommended): "Lock your plan for this week? Commitments can't be changed after locking."
- Call `api.plans.transitionPlan(planId, 'LOCKED')`
- On success: update plan status, disable editing, show LOCKED badge
- On error (409): display error message

### 8. Router Update

Replace the `/my-week` placeholder in `router.tsx` with `WeeklyPlanningPage`.

## Acceptance Criteria

- [ ] Page loads and displays the current week's plan with title, status badge, and commitment count
- [ ] Strategy Browser shows the RCDO tree with collapsible levels
- [ ] Commitment list shows all commitments ordered by priority with rank, description, and linked Outcome path
- [ ] "Add Commitment" opens a form where IC can enter description, select Outcome from tree, and add notes
- [ ] Edit icon opens the form pre-filled with existing commitment data
- [ ] Delete icon removes the commitment and recompacts priorities
- [ ] Drag-and-drop reorders commitments and persists via the reorder API
- [ ] "Lock Plan" transitions to LOCKED and disables all editing
- [ ] In LOCKED state, action buttons switch to "Begin Reconciliation"
- [ ] All styling matches `st6.pen` frame `K3Xao` design tokens

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — WeeklyPlanningPage tests pass
- [ ] Visual comparison with `st6.pen` frame `K3Xao` screenshot

## Stop and Ask

- If `@dnd-kit/core` cannot be installed due to peer dependency conflicts with the host app, implement up/down arrow buttons instead and note the conflict.
