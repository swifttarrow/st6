# Task 009: Tests

## Purpose

Add unit and integration tests for all new and modified code in this milestone, ensuring the RCDO management UI works correctly and existing functionality is not regressed.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/api/rcdo.ts` (mutation methods from Task 001)
  - `frontend/src/api/types.ts` (reconciled types from Task 001)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Tasks 003–008)
  - `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx` (from Task 006)
  - `frontend/src/components/Sidebar/Sidebar.tsx` (updated in Task 003)
  - `frontend/src/__tests__/` (existing test directory)
  - `frontend/src/__tests__/api/` (existing API tests — read these first to understand the mocking pattern)
  - `frontend/src/__tests__/Sidebar.test.tsx` (existing Sidebar test)
  - `frontend/src/__tests__/components/` (existing component tests)
  - `frontend/src/__tests__/pages/` (existing page tests)

## Outputs

- Create: `frontend/src/__tests__/api/rcdo.test.ts`
- Create: `frontend/src/__tests__/pages/StrategyManagementPage.test.tsx`
- Modify: `frontend/src/__tests__/Sidebar.test.tsx`
- Possibly modify: any existing test that asserted on `.title` for RCDO types (update to `.name`)

## Dependencies

- Prior task: `008-archive-and-unarchive.md`
- Required artifacts: All components and API methods from Tasks 001–008

## Constraints

- Use Vitest and `@testing-library/react` as used by existing tests
- Read existing test files in `frontend/src/__tests__/api/` and `frontend/src/__tests__/pages/` first to understand the exact mocking patterns before writing new tests — follow those patterns
- Mock `fetch` for API tests
- Mock `useApi` and `useUserContext` for component tests
- Every test must have a descriptive name and test a single behavior

## Required Changes

### 1. Fix any existing tests broken by the type rename

Before writing new tests, run `cd frontend && npx vitest run` to check if existing tests reference `.title` on RCDO types. If any tests fail due to the Task 001 rename:
- Update those assertions from `.title` to `.name`
- Update `outcomeTitle` → `outcomeName`, `definingObjectiveTitle` → `definingObjectiveName`, `rallyCryTitle` → `rallyCryName` in test fixtures

### 2. Create `frontend/src/__tests__/api/rcdo.test.ts`

Test each new RCDO API method. Structure tests to match existing API test patterns found in `frontend/src/__tests__/api/`.

**Mutation methods (one test each, happy path):**
- `createRallyCry` — sends POST to `/api/rcdo/rally-cries` with `{ name, description }`, returns parsed `RallyCry`
- `updateRallyCry` — sends PUT to `/api/rcdo/rally-cries/{id}` with `{ name, description }`
- `archiveRallyCry` — sends PATCH to `/api/rcdo/rally-cries/{id}/archive` with no body
- `unarchiveRallyCry` — sends PATCH to `/api/rcdo/rally-cries/{id}/unarchive` with no body
- `createDefiningObjective` — sends POST to `/api/rcdo/defining-objectives` with `{ rallyCryId, name, description }`
- `updateDefiningObjective` — sends PUT to correct path
- `archiveDefiningObjective` — sends PATCH to correct path
- `unarchiveDefiningObjective` — sends PATCH to correct path
- `createOutcome` — sends POST to `/api/rcdo/outcomes` with `{ definingObjectiveId, name, description }`
- `updateOutcome` — sends PUT to correct path
- `archiveOutcome` — sends PATCH to correct path
- `unarchiveOutcome` — sends PATCH to correct path

**getTree with includeArchived:**
- `getTree()` (no arg) — sends GET to `/api/rcdo/tree`
- `getTree(true)` — sends GET to `/api/rcdo/tree?includeArchived=true`
- `getTree(false)` — sends GET to `/api/rcdo/tree` (no param)

**Error handling:**
- API returns 403 — verify `ApiError` is thrown with correct status

### 3. Create `frontend/src/__tests__/pages/StrategyManagementPage.test.tsx`

Test the StrategyManagementPage component.

**Role guard (3 tests):**
- IC user: renders redirect (check for Navigate or absence of page content)
- MANAGER user: renders the page with `data-testid="strategy-management"`
- LEADERSHIP user: renders the page

**Tree rendering (3 tests):**
- Displays Rally Cry names from the mock API response
- Displays Defining Objectives nested under Rally Cries
- Displays Outcomes nested under Defining Objectives

**Create Rally Cry (4 tests):**
- "New Rally Cry" button is visible (`data-testid="create-rally-cry-btn"`)
- Clicking it shows the create form (`data-testid="create-rally-cry-form"`)
- Create button is disabled when name is empty
- Submitting calls `createRallyCry` and refetches tree

**Create Defining Objective (2 tests):**
- "Add Objective" button visible on Rally Cry nodes
- Submitting calls `createDefiningObjective` with correct `rallyCryId`

**Create Outcome (2 tests):**
- "Add Outcome" button visible on DO nodes
- Submitting calls `createOutcome` with correct `definingObjectiveId`

**Form exclusivity (1 test):**
- Opening a DO create form closes an open RC create form

**Edit (3 tests):**
- Clicking edit shows inline inputs pre-populated with current values
- Save calls the correct update method for the node type
- Only one node in edit mode at a time

**Archive/Unarchive (4 tests):**
- Clicking archive shows confirmation (mock `window.confirm`)
- Confirming calls the correct archive method
- "Show archived" toggle fetches tree with `includeArchived=true`
- Unarchive button appears on archived nodes and calls correct method

**Error handling (1 test):**
- API error during any mutation displays ErrorToast

### 4. Update `frontend/src/__tests__/Sidebar.test.tsx`

Add 3 tests:
- MANAGER role sees "Strategy" nav item
- LEADERSHIP role sees "Strategy" nav item
- IC role does not see "Strategy" nav item

## Acceptance Criteria

- [ ] All existing tests pass (including any fixed for the `.title` → `.name` rename)
- [ ] All RCDO API mutation methods have at least one happy-path test
- [ ] `getTree` with and without `includeArchived` is tested
- [ ] StrategyManagementPage has tests for: role guard (3), tree rendering (3), create RC (4), create DO (2), create Outcome (2), form exclusivity (1), edit (3), archive/unarchive (4), error handling (1)
- [ ] Sidebar test covers the new "Strategy" nav item for all three roles
- [ ] All tests pass: `cd frontend && npx vitest run`

## Validation

- [ ] `cd frontend && npx vitest run` exits 0 with all tests passing

## Stop and Ask

- If existing test patterns differ significantly from what is described here (e.g., different mocking library, different file organization), follow the existing patterns and note the deviation
