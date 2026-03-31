# Task 005: Create Defining Objective

## Purpose

Add the ability to create a new Defining Objective under a selected Rally Cry from the Strategy Management page.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Tasks 003–004)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css` (from Tasks 003–004)
  - `frontend/src/api/rcdo.ts` (`createDefiningObjective` from Task 001)
  - `frontend/src/api/types.ts` (`CreateDefiningObjectiveRequest` from Task 001)

## Outputs

- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

## Dependencies

- Prior task: `004-create-rally-cry.md`
- Required artifacts: `StrategyManagementPage.tsx` with `activeCreateForm` state, `createName`/`createDescription` state, `resetCreateForm` helper, and form styles in the CSS module

## Constraints

- Reuse the same `activeCreateForm`, `createName`, `createDescription`, `creating` state from Task 004
- Setting `activeCreateForm` to `{ type: 'defining-objective', rallyCryId }` automatically closes any other open create form (Rally Cry form, or another DO form)
- The form must appear nested under the Rally Cry it belongs to (indented to DO level)
- The `rallyCryId` is taken from `activeCreateForm.rallyCryId` — the user does not type it

## Required Changes

### 1. Add per-Rally Cry "Add Objective" button

For each Rally Cry node in the tree, add a small "+" button or "Add Objective" text link next to the Rally Cry header row (right-aligned or after the name).

On click:
1. Call `resetCreateForm()` first (clears previous form state)
2. Set `activeCreateForm` to `{ type: 'defining-objective', rallyCryId: rc.id }`
3. Expand the Rally Cry if it is currently collapsed

### 2. Render the inline form when active

When `activeCreateForm?.type === 'defining-objective'` and `activeCreateForm.rallyCryId === rc.id`, render the create form below the Rally Cry header (before the DO list), indented to DO level (24px):

- Text input for name (placeholder: "Defining Objective name", auto-focused)
- Textarea for description (placeholder: "Description (optional)")
- "Create" and "Cancel" buttons (same pattern and styles as Task 004)

On submit:
1. Set `creating = true`
2. Call `api.rcdo.createDefiningObjective({ rallyCryId: activeCreateForm.rallyCryId, name: createName.trim(), description: createDescription })`
3. On success: `loadTree()`, then `resetCreateForm()`
4. On error: ErrorToast
5. `creating = false` in finally

### 3. Add styles for the indented form

- `.createFormIndented1`: margin-left `24px` (DO indent level)
- Same interior styles as the Rally Cry create form (already defined in Task 004)

Add `data-testid="add-do-btn"` on each "+" button.
Add `data-testid="create-do-form"` on the form container.

## Acceptance Criteria

- [ ] Each Rally Cry node has an "Add Objective" action button
- [ ] Clicking it reveals an inline form nested under that Rally Cry at DO indentation
- [ ] Opening this form closes any previously open create form (Rally Cry or other DO)
- [ ] Submitting the form calls `POST /api/rcdo/defining-objectives` with `{ rallyCryId, name, description }`
- [ ] After successful creation, the tree refetches and shows the new Defining Objective under its parent
- [ ] Cancel hides the form without API calls

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes
- [ ] Manual: create a Defining Objective under an existing Rally Cry, verify it appears nested correctly
- [ ] Manual: open a "New Rally Cry" form, then click "Add Objective" on an RC — the Rally Cry form closes

## Stop and Ask

- None expected
