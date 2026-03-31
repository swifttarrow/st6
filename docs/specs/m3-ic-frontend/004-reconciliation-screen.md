# Task 004: Reconciliation Screen

## Purpose

Implement the IC Reconciliation screen where ICs annotate each commitment with an actual status and notes, then submit the reconciliation to finalize the week.

## Inputs

- Spec: `docs/specs/m3-ic-frontend/README.md` (Design System section)
- Files: `frontend/src/api/` (from Task 002)
- Files: `frontend/src/components/` (Shell, PageHeader, Badge from Task 001)
- Design: `st6.pen` frame `69svb` — IC Reconciliation layout

## Outputs

- Create: `frontend/src/pages/Reconciliation/ReconciliationPage.tsx`
- Create: `frontend/src/pages/Reconciliation/ReconciliationPage.module.css`
- Create: `frontend/src/components/StatsBar/StatsBar.tsx` — summary stats (completed/partial/dropped)
- Create: `frontend/src/components/StatsBar/StatsBar.module.css`
- Create: `frontend/src/components/ReconciliationTable/ReconciliationTable.tsx`
- Create: `frontend/src/components/ReconciliationTable/ReconciliationTable.module.css`
- Create: `frontend/src/components/StatusSelect/StatusSelect.tsx` — actual-status dropdown
- Create: `frontend/src/components/StatusSelect/StatusSelect.module.css`
- Create: `frontend/src/__tests__/pages/ReconciliationPage.test.tsx`
- Modify: `frontend/src/router.tsx` — replace reconciliation placeholder
- Side effects: none

## Dependencies

- Prior task: `003-weekly-planning-screen.md` (shared components and patterns established)
- Required artifacts: API client, Shell, PageHeader, Badge components

## Constraints

- This screen is only accessible when the current week's plan is in RECONCILING or RECONCILED state. If the plan is DRAFT or LOCKED, redirect to /my-week.
- The page title shows the reconciled week's date range (e.g., "Reconcile Week — March 23–27, 2026") matching the design.
- All commitments must have an actual_status before the "Submit Reconciliation" button becomes active.
- In RECONCILED state, the screen is read-only (no dropdowns, no submit button).

## Required Changes

### 1. ReconciliationPage

`ReconciliationPage.tsx`:
- On mount, determine which plan to reconcile:
  - Fetch current week's plan via `api.plans.getPlan(todayDate)`
  - If plan is RECONCILING, use it
  - If plan is LOCKED, transition to RECONCILING via `api.plans.transitionPlan(planId, 'RECONCILING')`, then load
  - If plan is RECONCILED, display in read-only mode
  - If plan is DRAFT, redirect to `/my-week` (cannot reconcile an unlocked plan)
  - If no plan exists for the current week, redirect to `/my-week`
- Show a loading skeleton while fetching/transitioning
- Fetch commitments for the plan
- Render:
  - `PageHeader` with "Reconcile Week — {Mon}–{Fri}, {Year}" and RECONCILING badge
  - `StatsBar` showing live counts of each actual-status category
  - `ReconciliationTable` with all commitments
  - "Submit Reconciliation" button at bottom-right

### 2. Stats Bar

`StatsBar.tsx`:
- Props: `commitments: Commitment[]`
- Displays three stats with dividers between them:
  - Completed count (green text, Space Grotesk 18px semibold)
  - Partial count (dark text)
  - Dropped count (red text)
- Format: "{count}/{total} Completed", "{count} Partial", "{count} Dropped"
- Container: #FAFAFA background, 16px/24px padding, 1px border, 24px gap between stats
- Stats update optimistically in local state when the IC selects a status. If the API call fails, revert local state. Do not wait for API response before updating the displayed counts.
- Stats update in real-time as the IC annotates commitments

### 3. Reconciliation Table

`ReconciliationTable.tsx`:
- Props: `commitments: Commitment[]`, `planStatus: PlanStatus`, `onReconcile: (id, status, notes) => void`
- Header row: #, Commitment, Linked Outcome, Planned, Actual Status, Notes
- Header: #FAFAFA background, Space Grotesk 12px weight 500 grey text, 14px/20px padding
- Column widths per design: # (32px), Commitment (flex), Linked Outcome (160px), Planned (80px), Actual Status (150px), Notes (160px)
- Each row renders:
  - Priority rank number
  - Commitment description (Inter 13px medium)
  - Linked Outcome path "RC > DO > Outcome" (Inter 12px grey)
  - "Planned" label (static, Inter 12px grey)
  - `StatusSelect` dropdown (or read-only badge in RECONCILED state)
  - Notes text input (or read-only text in RECONCILED state)
- Row styling: 16px/20px padding, 1px bottom border

### 4. Status Select

`StatusSelect.tsx`:
- Props: `value: ActualStatus | null`, `onChange: (status: ActualStatus) => void`, `disabled: boolean`
- Dropdown/select with four options:
  - Completed — green border, green dot
  - Partially Completed — dark border, dark text
  - Not Started — grey border
  - Dropped — red border, red text
- When a value is selected, display as a styled badge (matching the design's colored badges)
- When no value is selected, show placeholder "Select status"
- Disabled when plan is RECONCILED

### 5. Notes Input

Inline text input in the Notes column:
- Editable when RECONCILING, read-only when RECONCILED
- Inter 12px, grey text
- On blur or enter, save via `onReconcile`

### 6. Submit Reconciliation

- Button: red filled (#E42313), white text, check icon + "Submit Reconciliation"
- Positioned bottom-right per design
- Disabled until all commitments have an actual_status
- On click:
  - Call `api.plans.transitionPlan(planId, 'RECONCILED')`
  - On success: update page to read-only RECONCILED state
  - On 409 (incomplete): show error listing unannotated items

### 7. Real-time Save

When the IC changes a status or types notes:
- Optimistically update the local state
- Call `api.commitments.reconcileCommitment(planId, commitmentId, { actualStatus, reconciliationNotes })`
- On error: revert local state and show error toast

### 8. Router Update

Replace the `/reconciliation` placeholder with `ReconciliationPage`.

## Acceptance Criteria

- [ ] Page displays all commitments with columns matching the design
- [ ] Stats bar shows live counts of completed/partial/dropped
- [ ] Each commitment has a status dropdown that updates via API on change
- [ ] Notes field saves on blur
- [ ] "Submit Reconciliation" is disabled until all commitments are annotated
- [ ] Submitting transitions plan to RECONCILED and makes the page read-only
- [ ] Attempting to submit with unannotated items shows an error
- [ ] In RECONCILED state, all fields are read-only and submit button is hidden
- [ ] Redirect to /my-week if plan is DRAFT or LOCKED
- [ ] Styling matches `st6.pen` frame `69svb`

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — ReconciliationPage tests pass
- [ ] Visual comparison with `st6.pen` frame `69svb` screenshot

## Stop and Ask

- If the reconciliation should support undo (reverting a submitted reconciliation), this is not in the current spec. Ask before adding it.
