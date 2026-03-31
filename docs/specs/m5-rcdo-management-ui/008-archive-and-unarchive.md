# Task 008: Archive, Unarchive, and Show Archived Toggle

## Purpose

Add archive and unarchive actions for all three RCDO node types and a "Show archived" toggle that reveals archived nodes with distinct styling.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Tasks 003–007)
  - `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx` (from Tasks 006–007)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`
  - `frontend/src/api/rcdo.ts` (`archiveRallyCry`, `unarchiveRallyCry`, etc. from Task 001; `getTree(includeArchived)` from Task 001)
  - `frontend/src/components/ErrorToast/ErrorToast.tsx`

## Outputs

- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

## Dependencies

- Prior task: `007-inline-edit.md`
- Required artifacts: `StrategyNodeRow` with edit support; `api.rcdo.getTree(includeArchived)` method from Task 001
- Backend dependency: Task `002-backend-tree-include-archived.md` must be complete so that `GET /api/rcdo/tree?includeArchived=true` returns archived items with `archived: true`

## Constraints

- Archive shows a confirmation before calling the API (`window.confirm()` is acceptable)
- Archived nodes are hidden by default
- "Show archived" toggle at the top of the page; when on, archived nodes appear with distinct styling
- Unarchive action appears only on archived nodes when "Show archived" is on
- After any archive/unarchive mutation, refetch the tree (respecting the current `showArchived` state)
- If the backend returns an error (e.g., 409 Conflict for archive-safety), display it via ErrorToast

## Required Changes

### 1. Add "Show archived" toggle to `StrategyManagementPage.tsx`

Add state:
- `showArchived` (`boolean`, default `false`)

Add a toggle next to the page header (after the "New Rally Cry" button area):
- Checkbox input + label "Show archived"
- `data-testid="show-archived-toggle"`

Update `loadTree`:
- Change the call to `api.rcdo.getTree(showArchived)` so that when `showArchived` is true, archived items are included
- Add `showArchived` to the dependency array of the effect that calls `loadTree`

When `showArchived` is false, the backend returns only active items (no client-side filtering needed).
When `showArchived` is true, the backend returns all items with `archived` flags; render archived items with a distinct style.

### 2. Extend `StrategyNodeRow` props for archive/unarchive

Add to `StrategyNodeRowProps`:

```typescript
archived?: boolean;
onArchive?: () => void;
onUnarchive?: () => void;
```

### 3. Update `StrategyNodeRow` rendering

- When `archived` is falsy and `onArchive` is provided: show an archive button (use `Archive` icon from lucide-react, size 14) in the action area next to the pencil edit button
- When `archived` is truthy and `onUnarchive` is provided: show an unarchive button (use `ArchiveRestore` icon from lucide-react, size 14) instead of archive
- When `archived` is truthy: do NOT show the edit pencil button (archived nodes should not be editable)
- When `archived` is truthy: apply a CSS class `.archived` to the row
- `data-testid="archive-node-btn"` on archive buttons
- `data-testid="unarchive-node-btn"` on unarchive buttons

### 4. Add archive/unarchive handlers in `StrategyManagementPage.tsx`

Add handler:
```typescript
handleArchive(id: string, type: 'rally-cry' | 'defining-objective' | 'outcome', name: string)
```
- Show `window.confirm(\`Archive "${name}"? This will hide it from IC views.\`)`
- If cancelled, return
- Call the appropriate archive method:
  - `'rally-cry'` → `api.rcdo.archiveRallyCry(id)`
  - `'defining-objective'` → `api.rcdo.archiveDefiningObjective(id)`
  - `'outcome'` → `api.rcdo.archiveOutcome(id)`
- On success: `loadTree()`
- On error: ErrorToast with `err.message` (handles 409 Conflict from archive-safety)

Add handler:
```typescript
handleUnarchive(id: string, type: 'rally-cry' | 'defining-objective' | 'outcome')
```
- Call the appropriate unarchive method (no confirmation needed)
- On success: `loadTree()`
- On error: ErrorToast

### 5. Pass archive props to `StrategyNodeRow` instances

For each node, pass:
- `archived={node.archived}`
- `onArchive={() => handleArchive(node.id, nodeType, node.name)}`
- `onUnarchive={() => handleUnarchive(node.id, nodeType)}`

### 6. Add archived node styles

- `.archived`: `opacity: 0.5`, `font-style: italic`
- `.archivedBadge` (optional): a small "Archived" text label next to the node name

## Acceptance Criteria

- [ ] "Show archived" toggle is visible and defaults to off
- [ ] When off, only active nodes are displayed
- [ ] When on, archived nodes appear with `opacity: 0.5` and italic styling
- [ ] Each active node has an archive action button
- [ ] Clicking archive shows a confirmation dialog with the node name
- [ ] Confirming calls the correct archive endpoint and refetches the tree
- [ ] Dismissing the confirmation does nothing
- [ ] Archive errors (including 409 Conflict) are displayed via ErrorToast
- [ ] Each archived node (when visible) has an unarchive button instead of archive and edit
- [ ] Clicking unarchive calls the correct endpoint and refetches the tree
- [ ] Toggling "Show archived" on/off correctly refetches and re-renders

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes
- [ ] Manual: archive an Outcome, verify it disappears; toggle "Show archived" on, verify it reappears dimmed; unarchive it, verify it returns to normal
- [ ] Manual: try archiving an Outcome with active commitments — if backend returns 409, verify ErrorToast shows the message

## Stop and Ask

- If Task 002 (backend tree includeArchived) is not yet complete, this task cannot be fully implemented — confirm backend readiness before starting
