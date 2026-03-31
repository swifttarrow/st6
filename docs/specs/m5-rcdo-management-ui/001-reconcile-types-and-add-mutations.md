# Task 001: Reconcile Frontend Types and Add Mutation API Methods

## Purpose

The existing frontend RCDO types do not match the backend JSON responses. The backend uses `name` but the frontend types use `title`. The tree types are missing `description` and the search result types use `outcomeTitle` instead of `outcomeName`. This task fixes all type mismatches and adds the new mutation methods needed for RCDO management.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files to modify:
  - `frontend/src/api/types.ts` — type definitions
  - `frontend/src/api/rcdo.ts` — RCDO API client
  - `frontend/src/api/index.ts` — API factory and exports
  - `frontend/src/components/StrategyBrowser/StrategyBrowser.tsx` — references `rc.title`, `d.title`, `o.title`
  - `frontend/src/components/CommitmentForm/CommitmentForm.tsx` — references `o.title`, `rc.title`, `d.title`
  - `frontend/src/components/CommitmentRow/CommitmentRow.tsx` — references `rc.title`, `d.title`, `o.title`
  - `frontend/src/components/ReconciliationTable/ReconciliationTable.tsx` — references `rc.title`, `dObj.title`, `outcome.title`

## Outputs

- Modify: `frontend/src/api/types.ts`
- Modify: `frontend/src/api/rcdo.ts`
- Modify: `frontend/src/api/index.ts`
- Modify: `frontend/src/components/StrategyBrowser/StrategyBrowser.tsx`
- Modify: `frontend/src/components/CommitmentForm/CommitmentForm.tsx`
- Modify: `frontend/src/components/CommitmentRow/CommitmentRow.tsx`
- Modify: `frontend/src/components/ReconciliationTable/ReconciliationTable.tsx`

## Dependencies

- Prior task: none

## Constraints

- Do not change any non-RCDO types (Plan, Commitment, Dashboard types remain unchanged)
- The `Commitment` type has its own `title` field — this is correct and must NOT be renamed
- Do not modify component behavior or layout; only rename field accesses

## Required Changes

### 1. Fix RCDO domain types in `frontend/src/api/types.ts`

Replace the existing RCDO domain types to match the backend response DTOs:

```typescript
// ── RCDO Domain Types ──

export interface RallyCry {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Fix RCDO tree types in `frontend/src/api/types.ts`

Replace the existing tree types. Add `description` (the backend sends it). Keep `archived` (Task 002 will add it to the backend response; until then it will be `undefined` which is falsy and safe):

```typescript
// ── RCDO Tree Types ──

export interface RcdoTreeOutcome {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
}

export interface RcdoTreeDefiningObjective {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
  outcomes: RcdoTreeOutcome[];
}

export interface RcdoTreeRallyCry {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
  definingObjectives: RcdoTreeDefiningObjective[];
}
```

Note: `archived` is `optional` (`?`) because the backend tree endpoint does not currently include it. Task 002 adds it. Until then, the field is `undefined`, which is falsy and safe for boolean checks.

### 3. Fix search result type in `frontend/src/api/types.ts`

Replace to match backend `RcdoSearchResult`:

```typescript
export interface OutcomeSearchResult {
  outcomeId: string;
  outcomeName: string;
  definingObjectiveId: string;
  definingObjectiveName: string;
  rallyCryId: string;
  rallyCryName: string;
}
```

### 4. Add mutation request types to `frontend/src/api/types.ts`

Add after the search result type:

```typescript
// ── RCDO Mutation Request Types ──

export interface CreateRallyCryRequest {
  name: string;
  description: string;
}

export interface UpdateRallyCryRequest {
  name: string;
  description: string;
  sortOrder?: number;
}

export interface CreateDefiningObjectiveRequest {
  rallyCryId: string;
  name: string;
  description: string;
}

export interface UpdateDefiningObjectiveRequest {
  name: string;
  description: string;
  sortOrder?: number;
}

export interface CreateOutcomeRequest {
  definingObjectiveId: string;
  name: string;
  description: string;
}

export interface UpdateOutcomeRequest {
  name: string;
  description: string;
  sortOrder?: number;
}
```

`sortOrder` is optional in update requests — the backend accepts it but this milestone does not use it.

### 5. Update component references: `title` → `name` for RCDO tree nodes

In **`frontend/src/components/StrategyBrowser/StrategyBrowser.tsx`**:
- Change all `o.title` → `o.name` (outcome references in filter and render)
- Change all `rc.title` → `rc.name` (Rally Cry header)
- Change all `d.title` → `d.name` (Defining Objective header)

In **`frontend/src/components/CommitmentForm/CommitmentForm.tsx`**:
- Change `o.title` → `o.name` in the outcome option mapping (where it builds the flat list for the dropdown)
- Change `rc.title` → `rc.name` and `d.title` → `d.name` in the path construction (`${rc.title} > ${d.title}` → `${rc.name} > ${d.name}`)
- Do NOT change `commitment.title` or the form's own `title` state variable — those reference the Commitment type, not RCDO

In **`frontend/src/components/CommitmentRow/CommitmentRow.tsx`**:
- Change `rc.title` → `rc.name`, `d.title` → `d.name`, `o.title` → `o.name` in the outcome path lookup
- Do NOT change `commitment.title` — that is the Commitment type

In **`frontend/src/components/ReconciliationTable/ReconciliationTable.tsx`**:
- Change `rc.title` → `rc.name`, `dObj.title` → `dObj.name`, `outcome.title` → `outcome.name` in the outcome path lookup
- Do NOT change `commitment.title` — that is the Commitment type

### 6. Update search result references

Search for any references to `outcomeTitle`, `definingObjectiveTitle`, or `rallyCryTitle` in the codebase and update to `outcomeName`, `definingObjectiveName`, `rallyCryName`.

### 7. Add mutation methods to `frontend/src/api/rcdo.ts`

Extend the `RcdoApi` interface and `createRcdoApi` implementation with these methods:

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `createRallyCry(req)` | POST | `/api/rcdo/rally-cries` | `CreateRallyCryRequest` | `Promise<RallyCry>` |
| `updateRallyCry(id, req)` | PUT | `/api/rcdo/rally-cries/{id}` | `UpdateRallyCryRequest` | `Promise<RallyCry>` |
| `archiveRallyCry(id)` | PATCH | `/api/rcdo/rally-cries/{id}/archive` | none | `Promise<RallyCry>` |
| `unarchiveRallyCry(id)` | PATCH | `/api/rcdo/rally-cries/{id}/unarchive` | none | `Promise<RallyCry>` |
| `createDefiningObjective(req)` | POST | `/api/rcdo/defining-objectives` | `CreateDefiningObjectiveRequest` | `Promise<DefiningObjective>` |
| `updateDefiningObjective(id, req)` | PUT | `/api/rcdo/defining-objectives/{id}` | `UpdateDefiningObjectiveRequest` | `Promise<DefiningObjective>` |
| `archiveDefiningObjective(id)` | PATCH | `/api/rcdo/defining-objectives/{id}/archive` | none | `Promise<DefiningObjective>` |
| `unarchiveDefiningObjective(id)` | PATCH | `/api/rcdo/defining-objectives/{id}/unarchive` | none | `Promise<DefiningObjective>` |
| `createOutcome(req)` | POST | `/api/rcdo/outcomes` | `CreateOutcomeRequest` | `Promise<Outcome>` |
| `updateOutcome(id, req)` | PUT | `/api/rcdo/outcomes/{id}` | `UpdateOutcomeRequest` | `Promise<Outcome>` |
| `archiveOutcome(id)` | PATCH | `/api/rcdo/outcomes/{id}/archive` | none | `Promise<Outcome>` |
| `unarchiveOutcome(id)` | PATCH | `/api/rcdo/outcomes/{id}/unarchive` | none | `Promise<Outcome>` |

Also add a method for fetching the tree with archived items (used by Task 008):

| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| `getTree(includeArchived?)` | GET | `/api/rcdo/tree?includeArchived={value}` | none | `Promise<RcdoTreeRallyCry[]>` |

Modify the existing `getTree()` to accept an optional `includeArchived` boolean parameter. When `true`, append `?includeArchived=true` to the URL. When `false` or omitted, call `/api/rcdo/tree` as before.

### 8. Export new types from `frontend/src/api/index.ts`

Add all six new request types to the `export type` block.

## Acceptance Criteria

- [ ] All RCDO types in `types.ts` use `name` instead of `title`
- [ ] `RallyCry`, `DefiningObjective`, `Outcome` types include `sortOrder`, `archivedAt`, `createdAt`, `updatedAt`
- [ ] Tree types include `description` and optional `archived`
- [ ] `OutcomeSearchResult` uses `outcomeName`, `definingObjectiveName`, `rallyCryName` and includes `definingObjectiveId`, `rallyCryId`
- [ ] All six mutation request types are defined and exported
- [ ] `RcdoApi` interface includes all 12 new mutation methods plus the `includeArchived` param on `getTree`
- [ ] All component references to RCDO `.title` are updated to `.name`
- [ ] No component references to `Commitment.title` are changed
- [ ] TypeScript compiles: `cd frontend && npx tsc --noEmit` exits 0
- [ ] Existing tests pass: `cd frontend && npx vitest run` exits 0

## Validation

- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && npx vitest run` passes (no regressions)
- [ ] `grep -r '\.title' frontend/src/components/StrategyBrowser/` returns no RCDO title references
- [ ] `grep -r 'outcomeTitle' frontend/src/` returns no results

## Stop and Ask

- If any existing test asserts on `.title` for RCDO types and fails after the rename, update the test assertion to use `.name` rather than reverting the type fix
