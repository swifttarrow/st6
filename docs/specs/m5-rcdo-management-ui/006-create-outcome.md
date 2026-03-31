# Task 006: Create Outcome and Extract Node Component

## Purpose

Add the ability to create a new Outcome under a selected Defining Objective. Additionally, extract the repeated node rendering logic into a reusable sub-component to manage complexity before edit/archive tasks add more state.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Tasks 003–005)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css` (from Tasks 003–005)
  - `frontend/src/api/rcdo.ts` (`createOutcome` from Task 001)
  - `frontend/src/api/types.ts` (`CreateOutcomeRequest` from Task 001)

## Outputs

- Create: `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx` (sub-component, co-located with page)
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

## Dependencies

- Prior task: `005-create-defining-objective.md`
- Required artifacts: `StrategyManagementPage.tsx` with `activeCreateForm` state including `defining-objective` type, and create form styles

## Constraints

- Reuse the same `activeCreateForm`, `createName`, `createDescription`, `creating` state
- The form appears nested under the Defining Objective at Outcome indent level (48px)
- `definingObjectiveId` is taken from `activeCreateForm.definingObjectiveId`

## Required Changes

### 1. Extract `StrategyNodeRow` sub-component

Create `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx`:

```typescript
interface StrategyNodeRowProps {
  name: string;
  description?: string;
  level: 'rally-cry' | 'defining-objective' | 'outcome';
  expanded?: boolean;
  onToggleExpand?: () => void;
  onAddChild?: () => void;
  addChildLabel?: string;
  // These props will be extended in Tasks 007 and 008:
  // onEdit, onArchive, onUnarchive, archived
  children?: React.ReactNode;
}
```

This component renders:
- A row with chevron toggle (if `onToggleExpand` provided), the `name`, and a secondary `description`
- An "Add [child]" button (if `onAddChild` provided) on the right side of the row
- `children` slot below the row (for nested nodes and forms)
- Applies the correct indent CSS class based on `level`

### 2. Refactor `StrategyManagementPage.tsx` to use `StrategyNodeRow`

Replace the inline tree rendering (Rally Cry rows, DO rows, Outcome rows) with `StrategyNodeRow` instances. This reduces the page component's JSX and makes each level's rendering consistent.

### 3. Add per-Defining Objective "Add Outcome" button

For each Defining Objective node, pass `onAddChild` to `StrategyNodeRow` with `addChildLabel="Add Outcome"`.

On click:
1. `resetCreateForm()`
2. Set `activeCreateForm` to `{ type: 'outcome', definingObjectiveId: d.id }`
3. Expand the DO if collapsed

### 4. Render the inline form when active

When `activeCreateForm?.type === 'outcome'` and `activeCreateForm.definingObjectiveId === d.id`, render the create form below the DO header at Outcome indent (48px):

- Text input for name (placeholder: "Outcome name", auto-focused)
- Textarea for description (placeholder: "Description (optional)")
- "Create" and "Cancel" buttons

On submit:
1. Call `api.rcdo.createOutcome({ definingObjectiveId: activeCreateForm.definingObjectiveId, name: createName.trim(), description: createDescription })`
2. On success: `loadTree()`, `resetCreateForm()`
3. On error: ErrorToast

### 5. Add styles for Outcome-level indent

- `.createFormIndented2`: margin-left `48px` (Outcome indent level)

Add `data-testid="add-outcome-btn"` on each "+" button.
Add `data-testid="create-outcome-form"` on the form container.

## Acceptance Criteria

- [ ] `StrategyNodeRow` component exists at `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx`
- [ ] All three node levels (RC, DO, Outcome) render via `StrategyNodeRow`
- [ ] Each Defining Objective node has an "Add Outcome" action button
- [ ] Clicking it reveals an inline form nested under that Defining Objective
- [ ] Opening this form closes any other open create form
- [ ] Submitting calls `POST /api/rcdo/outcomes` with `{ definingObjectiveId, name, description }`
- [ ] After successful creation, the tree refetches and shows the new Outcome
- [ ] Cancel hides the form without API calls

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes
- [ ] Manual: create an Outcome under an existing Defining Objective, verify it appears nested
- [ ] Manual: open a "New Rally Cry" form, then click "Add Outcome" — Rally Cry form closes

## Stop and Ask

- None expected
