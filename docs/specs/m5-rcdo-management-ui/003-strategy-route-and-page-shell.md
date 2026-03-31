# Task 003: Strategy Route and Page Shell

## Purpose

Add a `/strategy` route with a page shell that renders the RCDO hierarchy tree in a management context (not the IC linking context). Add a sidebar navigation entry visible only to MANAGER and LEADERSHIP roles. Implement a role guard that redirects IC users.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/router.tsx` (existing routes)
  - `frontend/src/components/Sidebar/Sidebar.tsx` (nav items and role gating)
  - `frontend/src/pages/ManagerDashboard/ManagerDashboardPage.tsx` (reference pattern for page structure, role guard, data loading)
  - `frontend/src/components/PageHeader/PageHeader.tsx` (reusable header)
  - `frontend/src/context/ApiContext.tsx` (`useApi` hook)
  - `frontend/src/context/UserContext.tsx` (`useUserContext` hook)
  - `frontend/src/api/types.ts` (`RcdoTreeRallyCry` — uses `name` and `description` after Task 001)

## Outputs

- Create: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Create: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`
- Modify: `frontend/src/router.tsx`
- Modify: `frontend/src/components/Sidebar/Sidebar.tsx`

## Dependencies

- Prior task: `001-reconcile-types-and-add-mutations.md` (corrected types and mutation API methods)

## Constraints

- Follow existing page patterns: `useApi()`, `useUserContext()`, `useState` for loading/error/data, `useEffect` for data fetch
- Use `PageHeader` component for the page title
- Use `ErrorToast` for transient errors
- Use CSS Modules with tokens from `frontend/src/styles/tokens.css`
- Add `data-testid="strategy-management"` on the page root element
- Tree nodes use `.name` and `.description` (not `.title`)

## Required Changes

### 1. Create `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`

- Import `useApi`, `useUserContext`, `PageHeader`, `ErrorToast`, `Navigate` from react-router-dom
- Role guard: if `userContext.role === 'IC'`, return `<Navigate to="/my-week" replace />`
- State: `tree` (`RcdoTreeRallyCry[]`), `loading` (`boolean`), `error` (`string | null`)
- Define a `loadTree` callback that calls `api.rcdo.getTree()` and sets tree state. This callback will be passed down to child forms in later tasks for refetch-after-mutation.
- On mount: call `loadTree()`
- Render:
  - `PageHeader` with title "Strategy Management"
  - Loading state: `<div className={styles.loading}>Loading...</div>` while fetching
  - Error state if fetch fails and no data
  - The RCDO tree as a nested list:
    - Rally Cries at top level, each showing `name` and `description`
    - Defining Objectives nested under Rally Cries, each showing `name` and `description`
    - Outcomes nested under Defining Objectives, each showing `name`
  - Each Rally Cry and Defining Objective rendered with expand/collapse toggle (chevron icon, same pattern as `StrategyBrowser`)
  - All nodes expanded by default on initial load
  - `data-testid="strategy-management"` on root div

### 2. Create `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

Style the page using existing design tokens:
- Page layout matching other pages (padding, max-width)
- Tree indentation: Rally Cry → 0px, Defining Objective → 24px, Outcome → 48px
- Node rows: flex layout with name prominent, description secondary (lighter color)
- Hover state on node rows (subtle background change)
- Chevron rotation for expand/collapse (same approach as `StrategyBrowser`)

### 3. Modify `frontend/src/router.tsx`

- Import `StrategyManagementPage` from `./pages/StrategyManagement/StrategyManagementPage`
- Add route: `<Route path="/strategy" element={<StrategyManagementPage />} />`
- Place it before the catch-all `<Route path="*" ...>` redirect

### 4. Modify `frontend/src/components/Sidebar/Sidebar.tsx`

Add a new entry to `NAV_ITEMS` array:

```typescript
{
  path: '/strategy',
  label: 'Strategy',
  minRole: 'MANAGER',
  icon: <Target size={14} />,
},
```

Import `Target` from `lucide-react`.

## Acceptance Criteria

- [ ] Navigating to `/strategy` as MANAGER renders the page with the RCDO tree
- [ ] Navigating to `/strategy` as LEADERSHIP renders the page with the RCDO tree
- [ ] Navigating to `/strategy` as IC redirects to `/my-week`
- [ ] Sidebar shows "Strategy" link for MANAGER and LEADERSHIP, not for IC
- [ ] Tree displays Rally Cries with `name` and `description`, Defining Objectives nested with `name` and `description`, Outcomes nested with `name`
- [ ] Expand/collapse toggles work on Rally Cries and Defining Objectives
- [ ] Page uses `PageHeader` with title "Strategy Management"
- [ ] `data-testid="strategy-management"` is present on the page root

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes (no regressions)
- [ ] Manual: start dev server, navigate to `/strategy` as MANAGER — tree renders with names and descriptions
- [ ] Manual: navigate to `/strategy` as IC — redirects to `/my-week`

## Stop and Ask

- If `api.rcdo.getTree()` returns a different shape than expected after Task 001's type changes, reconcile before rendering
