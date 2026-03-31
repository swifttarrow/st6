# Task 004: Create Rally Cry

## Purpose

Add the ability for MANAGER and LEADERSHIP users to create a new Rally Cry from the Strategy Management page. After creation, the tree refetches and displays the new node.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Task 003)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css` (from Task 003)
  - `frontend/src/api/rcdo.ts` (with `createRallyCry` from Task 001)
  - `frontend/src/api/types.ts` (`CreateRallyCryRequest` from Task 001)
  - `frontend/src/components/ErrorToast/ErrorToast.tsx`

## Outputs

- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

## Dependencies

- Prior task: `003-strategy-route-and-page-shell.md`
- Required artifacts: `StrategyManagementPage.tsx` with tree rendering, `loadTree` callback, and `api.rcdo.createRallyCry` method

## Constraints

- Name field is required; disable submit button when name is empty
- Description field is optional (may be empty string)
- After successful creation, refetch the tree via `loadTree()` and collapse the form
- On API error, display the error message using `ErrorToast`
- Form should be inline on the page (not a modal), appearing at the top of the tree when toggled
- Opening this form must close any other open create form (this is the first create form, so just track the state; later tasks will extend this rule)

## Required Changes

### 1. Add create form state to `StrategyManagementPage.tsx`

Add a state variable to track which create form is open:
- `activeCreateForm`: `{ type: 'rally-cry' } | { type: 'defining-objective'; rallyCryId: string } | { type: 'outcome'; definingObjectiveId: string } | null`
  - Initialize to `null`
  - This single state variable will be used by Tasks 005 and 006 as well, ensuring only one create form is open at a time

Add form field state:
- `createName` (`string`, default `''`)
- `createDescription` (`string`, default `''`)
- `creating` (`boolean`, default `false`)

Add a `resetCreateForm` helper that sets `activeCreateForm` to `null` and clears `createName` and `createDescription`.

### 2. Add "New Rally Cry" button and inline form

- Add a button above the tree: "New Rally Cry" (use `Plus` icon from lucide-react)
- On click: set `activeCreateForm` to `{ type: 'rally-cry' }` and reset form fields
- When `activeCreateForm?.type === 'rally-cry'`, render an inline form above the tree list:
  - Text input for name (placeholder: "Rally Cry name", auto-focused)
  - Textarea for description (placeholder: "Description (optional)")
  - "Create" button (disabled when `createName.trim()` is empty or `creating` is true)
  - "Cancel" button that calls `resetCreateForm()`
- On submit:
  1. Set `creating = true`
  2. Call `api.rcdo.createRallyCry({ name: createName.trim(), description: createDescription })`
  3. On success: call `loadTree()`, then `resetCreateForm()`
  4. On error: show ErrorToast with `err.message`
  5. Set `creating = false` in a finally block
- Add `data-testid="create-rally-cry-btn"` on the toggle button
- Add `data-testid="create-rally-cry-form"` on the form container

### 3. Add form styles to `StrategyManagementPage.module.css`

- `.createForm`: border `1px solid var(--color-border)`, border-radius `8px`, padding `16px`, margin-bottom `16px`, background `var(--color-bg-secondary)` or similar
- `.formInput`: full width, border, padding `8px 12px`, font-size `13px`, border-radius `4px`
- `.formTextarea`: same as input but multi-line, min-height `60px`
- `.formActions`: display flex, gap `8px`, justify-content `flex-end`, margin-top `12px`
- `.formButton`: padding `6px 16px`, border-radius `4px`, font-size `13px`
- `.formButtonPrimary`: background `var(--color-primary)`, color white, disabled opacity `0.5`
- `.formButtonSecondary`: background transparent, border `1px solid var(--color-border)`

## Acceptance Criteria

- [ ] "New Rally Cry" button is visible on the strategy page
- [ ] Clicking the button reveals an inline form with name input, description textarea, Create and Cancel buttons
- [ ] Create button is disabled when name input is empty or whitespace-only
- [ ] Submitting the form calls `POST /api/rcdo/rally-cries` with `{ name, description }`
- [ ] After successful creation, the tree refetches and shows the new Rally Cry
- [ ] The form collapses and resets after successful creation
- [ ] API errors are displayed via ErrorToast
- [ ] Cancel button hides the form without making any API call
- [ ] `activeCreateForm` state is a single variable (not separate booleans per form type)

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes
- [ ] Manual: create a Rally Cry, verify it appears in the tree

## Stop and Ask

- None expected
