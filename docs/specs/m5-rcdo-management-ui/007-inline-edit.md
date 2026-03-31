# Task 007: Inline Edit

## Purpose

Add inline editing of name and description for all three RCDO node types (Rally Cry, Defining Objective, Outcome) on the Strategy Management page.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx` (from Tasks 003–006)
  - `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx` (from Task 006)
  - `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`
  - `frontend/src/api/rcdo.ts` (`updateRallyCry`, `updateDefiningObjective`, `updateOutcome` from Task 001)
  - `frontend/src/api/types.ts` (update request types from Task 001)
  - `frontend/src/components/ErrorToast/ErrorToast.tsx`

## Outputs

- Modify: `frontend/src/pages/StrategyManagement/StrategyNodeRow.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.tsx`
- Modify: `frontend/src/pages/StrategyManagement/StrategyManagementPage.module.css`

## Dependencies

- Prior task: `006-create-outcome.md`
- Required artifacts: `StrategyNodeRow` component rendering all three node levels

## Constraints

- Only one node may be in edit mode at a time; entering edit on one node exits edit on any other
- Entering edit mode must also close any open create form (set `activeCreateForm` to `null`)
- Name field is required; Save button disabled when name is empty
- Cancel restores original values without API call

## Required Changes

### 1. Add edit state to `StrategyManagementPage.tsx`

Add state:
- `editingNode`: `{ id: string; type: 'rally-cry' | 'defining-objective' | 'outcome'; name: string; description: string } | null`
- `saving`: `boolean`

Add handlers:
- `handleStartEdit(id, type, currentName, currentDescription)`: sets `editingNode`, closes `activeCreateForm`
- `handleSaveEdit()`: calls the appropriate update method based on `editingNode.type`:
  - `'rally-cry'` → `api.rcdo.updateRallyCry(id, { name, description })`
  - `'defining-objective'` → `api.rcdo.updateDefiningObjective(id, { name, description })`
  - `'outcome'` → `api.rcdo.updateOutcome(id, { name, description })`
  - On success: `loadTree()`, set `editingNode` to `null`
  - On error: ErrorToast
- `handleCancelEdit()`: sets `editingNode` to `null`

### 2. Extend `StrategyNodeRow` props

Add to the `StrategyNodeRowProps` interface:

```typescript
editing?: boolean;
editName?: string;
editDescription?: string;
onEditNameChange?: (value: string) => void;
onEditDescriptionChange?: (value: string) => void;
onStartEdit?: () => void;
onSaveEdit?: () => void;
onCancelEdit?: () => void;
editSaving?: boolean;
```

### 3. Update `StrategyNodeRow` rendering

- When `editing` is `false` (default): render the name and description as text, with a pencil icon button (`Pencil` from lucide-react, size 14) that calls `onStartEdit`
- When `editing` is `true`: replace the name text with a text input (value `editName`, onChange `onEditNameChange`), replace description with a textarea (value `editDescription`, onChange `onEditDescriptionChange`), and show "Save" (disabled when `editName` is empty or `editSaving`) and "Cancel" buttons
- Pencil button: `data-testid="edit-node-btn"`

### 4. Pass edit props from page to each `StrategyNodeRow`

For each node in the tree, pass:
- `editing={editingNode?.id === node.id}`
- `editName={editingNode?.id === node.id ? editingNode.name : undefined}`
- `editDescription={editingNode?.id === node.id ? editingNode.description : undefined}`
- `onEditNameChange={(v) => setEditingNode(prev => prev ? { ...prev, name: v } : null)}`
- `onEditDescriptionChange={(v) => setEditingNode(prev => prev ? { ...prev, description: v } : null)}`
- `onStartEdit={() => handleStartEdit(node.id, nodeType, node.name, node.description)}`
- `onSaveEdit={handleSaveEdit}`
- `onCancelEdit={handleCancelEdit}`
- `editSaving={saving}`

### 5. Add edit-mode styles

- `.editInput`: same as `.formInput` (from Task 004)
- `.editTextarea`: same as `.formTextarea`
- `.editActions`: same layout as `.formActions`
- Pencil icon button: small, transparent, appears on node row hover

## Acceptance Criteria

- [ ] Each node (Rally Cry, DO, Outcome) shows a pencil edit button
- [ ] Clicking edit replaces the node's name and description with editable inputs pre-populated with current values
- [ ] Only one node can be in edit mode at a time
- [ ] Entering edit mode closes any open create form
- [ ] Save calls the correct update endpoint for the node type
- [ ] Save is disabled when name is empty
- [ ] After successful save, the tree refetches and shows the updated values
- [ ] Cancel restores the original display without API calls
- [ ] API errors are displayed via ErrorToast

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes
- [ ] Manual: edit a Rally Cry's name, save, verify the new name persists
- [ ] Manual: edit a DO's description, save, verify
- [ ] Manual: start editing one node, click edit on another — first edit is cancelled

## Stop and Ask

- None expected
