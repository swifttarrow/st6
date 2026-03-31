# Task 005: Carry Forward UI and Edge Cases

## Purpose

Implement the carry-forward visual indicators, archived-outcome warnings, empty states, loading states, and error handling across both IC screens. These polish the user experience for edge cases defined in the PRD.

## Inputs

- Spec: `docs/specs/m3-ic-frontend/README.md`
- Files: `frontend/src/pages/WeeklyPlanning/WeeklyPlanningPage.tsx` (from Task 003)
- Files: `frontend/src/pages/Reconciliation/ReconciliationPage.tsx` (from Task 004)
- Files: `frontend/src/components/CommitmentRow/CommitmentRow.tsx` (from Task 003)
- PRD: Carry Forward section, System Behavior and Edge Cases section

## Outputs

- Create: `frontend/src/components/CarryForwardBanner/CarryForwardBanner.tsx`
- Create: `frontend/src/components/CarryForwardBanner/CarryForwardBanner.module.css`
- Create: `frontend/src/components/ArchivedOutcomeWarning/ArchivedOutcomeWarning.tsx`
- Create: `frontend/src/components/ArchivedOutcomeWarning/ArchivedOutcomeWarning.module.css`
- Create: `frontend/src/components/EmptyState/EmptyState.tsx`
- Create: `frontend/src/components/EmptyState/EmptyState.module.css`
- Create: `frontend/src/components/ErrorToast/ErrorToast.tsx`
- Create: `frontend/src/components/ErrorToast/ErrorToast.module.css`
- Modify: `frontend/src/pages/WeeklyPlanning/WeeklyPlanningPage.tsx` — integrate carry-forward indicators and edge cases
- Modify: `frontend/src/components/CommitmentRow/CommitmentRow.tsx` — add carry-forward and archived-outcome visual states
- Create: `frontend/src/__tests__/components/CarryForwardBanner.test.tsx`
- Create: `frontend/src/__tests__/components/ArchivedOutcomeWarning.test.tsx`
- Side effects: none

## Dependencies

- Prior task: `004-reconciliation-screen.md`
- Required artifacts: WeeklyPlanningPage, ReconciliationPage, CommitmentRow, API client

## Constraints

- Carry-forward indicators must be visually distinct but not disruptive — a subtle badge or label, not a blocking modal.
- Archived-outcome warnings must block locking. The IC cannot lock until all commitments reference active Outcomes.
- Empty states must be helpful, not just blank. Guide the IC on what to do next.
- Error handling must be non-blocking (toast/banner) for recoverable errors and blocking (modal) for critical failures.

## Required Changes

### 1. Carry-Forward Banner

`CarryForwardBanner.tsx`:
- Props: `carriedForwardCount: number`, `onDismiss: () => void`
- Shown at the top of the commitment list when the plan has carry-forward items
- Message: "{count} commitment(s) carried forward from last week. Review and adjust as needed."
- Subtle background (#FAFAFA), info icon, dismissable
- Only shown in DRAFT state

### 2. Carry-Forward Row Indicator

Modify `CommitmentRow.tsx`:
- When `commitment.carriedForward` is true, show a small "Carried forward" tag next to the description
- Tag styling: Inter 11px, grey background pill, subtle and non-intrusive

### 3. Archived Outcome Warning

`ArchivedOutcomeWarning.tsx`:
- Props: `commitmentId: string`, `outcomeName: string`, `onRelink: (commitmentId: string) => void`
- Shown inline on the commitment row when `commitment.outcomeArchived` is true
- Red-tinted background (#FEF2F2), warning icon, message: "This outcome has been archived. Please link to an active outcome before locking."
- "Re-link" action opens the CommitmentForm in edit mode for that commitment

Modify `CommitmentRow.tsx`:
- When `commitment.outcomeArchived` is true, render `ArchivedOutcomeWarning` below the row
- Change the Linked Outcome text to strikethrough with red color

### 4. Lock Validation in UI

Modify `WeeklyPlanningPage.tsx`:
- Before calling the lock API, check client-side if any commitment has `outcomeArchived: true`
- If so, show a blocking message: "Cannot lock: {count} commitment(s) reference archived outcomes. Please re-link them first."
- Highlight the affected rows

### 5. Empty States

`EmptyState.tsx`:
- Props: `title: string`, `description: string`, `action?: { label: string, onClick: () => void }`
- Centered in the content area, with an illustrative icon/placeholder

Use in:
- **Weekly Planning with no commitments**: "No commitments yet. Add your first commitment to start planning your week." + "Add Commitment" button
- **Reconciliation with no commitments**: "No commitments to reconcile this week."
- **Strategy Browser with empty hierarchy**: "No strategic goals defined yet. Contact your manager to set up Rally Cries."

### 6. Loading States

Add to both pages:
- Skeleton/spinner while fetching plan and commitments
- Button loading states during API calls (lock, submit reconciliation)
- Disable interactive elements during in-flight requests

### 7. Error Toast

`ErrorToast.tsx`:
- Props: `message: string`, `onDismiss: () => void`
- Floating toast in bottom-right corner
- Red-tinted background, auto-dismiss after 5 seconds
- Used for: failed API calls, network errors, 409 conflicts

Wire into both pages:
- Catch API errors and display via ErrorToast
- Specific messages for known errors:
  - 409 on lock: "Cannot lock: {error detail}"
  - 409 on reconciliation submit: "All commitments must have a status"
  - Network error: "Connection failed. Please try again."

### 8. Stale Plan Detection

- Use client-local time to determine if the displayed week has ended (current date is past Friday of the displayed week's Monday). This is an approximation; timezone edge cases are acceptable for first release.
- If stale, show a banner at the top of the Weekly Planning page: "This week has ended. Visit reconciliation to review your commitments." with a link to /reconciliation.
- Banner styling: #FAFAFA background, info icon, Inter 13px, full-width, 12px/20px padding.

## Acceptance Criteria

- [ ] Carry-forward items show a "Carried forward" tag on the commitment row
- [ ] A banner appears when the plan has carry-forward items
- [ ] Archived Outcome commitments show a red warning with re-link action
- [ ] Plan cannot be locked with archived-outcome commitments (client-side validation + server 409 handling)
- [ ] Empty state shows when no commitments exist with helpful guidance
- [ ] Loading spinners/skeletons appear during data fetching
- [ ] API errors display as toast notifications with clear messages
- [ ] Buttons show loading state during API calls
- [ ] Stale week banner appears when viewing a past week

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — all edge case tests pass
- [ ] Manual: create a plan with carry-forward items → verify indicators → archive an Outcome → verify warning → attempt lock → verify blocked

## Stop and Ask

- If carry-forward items require a different visual treatment than what's specified here (e.g., a separate section instead of inline tags), ask for design clarification.
