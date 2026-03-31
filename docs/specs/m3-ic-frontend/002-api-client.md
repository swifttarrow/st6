# Task 002: Typed API Client

## Purpose

Create a typed TypeScript API client that wraps all backend endpoints from M1 and M2. Both the Weekly Planning and Reconciliation screens depend on this client for all data fetching and mutations.

## Inputs

- Spec: `docs/specs/m3-ic-frontend/README.md`
- Spec: `docs/specs/m1-data-foundation/` — all API endpoint definitions
- Spec: `docs/specs/m2-weekly-lifecycle/` — all API endpoint definitions
- Files: `frontend/src/types/host-context.ts` (from M1 Task 001)

## Outputs

- Create: `frontend/src/api/client.ts` — base HTTP client with auth headers
- Create: `frontend/src/api/rcdo.ts` — RCDO hierarchy endpoints
- Create: `frontend/src/api/plans.ts` — weekly plan endpoints
- Create: `frontend/src/api/commitments.ts` — commitment CRUD + reconciliation endpoints
- Create: `frontend/src/api/types.ts` — shared response/request types
- Create: `frontend/src/api/index.ts` — barrel export
- Create: `frontend/src/__tests__/api/rcdo.test.ts`
- Create: `frontend/src/__tests__/api/plans.test.ts`
- Create: `frontend/src/__tests__/api/commitments.test.ts`
- Side effects: none

## Dependencies

- Prior task: `001-design-tokens-and-shell.md`
- Required artifacts: `frontend/src/context/UserContext.tsx` (for auth headers)

## Constraints

- All API types must match the backend response shapes defined in M1/M2 specs exactly.
- The base URL must be configurable via environment variable (e.g., `VITE_API_BASE_URL` or equivalent).
- Auth headers (`X-User-Id`, `X-User-Role`, `X-Team-Id`, `X-Manager-Id`) must be set on every request from the UserContext.
- All functions must return typed promises. No `any` types.
- Error responses must be parsed into a typed error structure with status code and message.
- Network errors (no response body) throw `ApiError` with `status: 0` and `message: "Network request failed"`.
- Non-JSON responses throw `ApiError` with the HTTP status code and a generic error message.
- No automatic retry logic — callers handle retries. 409 conflicts are normal API errors, not retryable.
- The API client factory must be initialized in the `mount()` function and provided to the component tree via React context (alongside UserContext).

## Required Changes

### 1. Shared Types (`types.ts`)

```typescript
// RCDO
interface RallyCry { id: string; name: string; description: string; sortOrder: number; archivedAt: string | null; createdAt: string; updatedAt: string; }
interface DefiningObjective { id: string; rallyCryId: string; name: string; description: string; sortOrder: number; archivedAt: string | null; createdAt: string; updatedAt: string; }
interface Outcome { id: string; definingObjectiveId: string; name: string; description: string; sortOrder: number; archivedAt: string | null; createdAt: string; updatedAt: string; }

// Tree (matches M1 Task 004 response shape exactly)
interface RcdoTreeRallyCry { id: string; name: string; description: string; definingObjectives: RcdoTreeDefiningObjective[]; }
interface RcdoTreeDefiningObjective { id: string; name: string; description: string; outcomes: RcdoTreeOutcome[]; }
interface RcdoTreeOutcome { id: string; name: string; description: string; }

// Search
interface OutcomeSearchResult { outcomeId: string; outcomeName: string; definingObjectiveId: string; definingObjectiveName: string; rallyCryId: string; rallyCryName: string; }

// Plans
type PlanStatus = 'DRAFT' | 'LOCKED' | 'RECONCILING' | 'RECONCILED';
interface WeeklyPlan { id: string; userId: string; weekStartDate: string; status: PlanStatus; createdAt: string; updatedAt: string; }
interface PlanTransition { id: string; weeklyPlanId: string; fromStatus: string; toStatus: string; triggeredBy: string; transitionedAt: string; }

// Commitments
type ActualStatus = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_STARTED' | 'DROPPED';
interface Commitment {
  id: string; description: string; priority: number; notes: string | null;
  outcomeId: string; outcomeName: string;
  definingObjectiveId: string; definingObjectiveName: string;
  rallyCryId: string; rallyCryName: string;
  actualStatus: ActualStatus | null; reconciliationNotes: string | null;
  carriedForwardFromId: string | null; carriedForward: boolean; outcomeArchived: boolean;
  createdAt: string; updatedAt: string;
}

// Requests
interface CreateCommitmentRequest { description: string; outcomeId: string; notes?: string; }
interface UpdateCommitmentRequest { description?: string; outcomeId?: string; notes?: string; }
interface ReconcileItemRequest { commitmentId: string; actualStatus: ActualStatus; reconciliationNotes?: string; }

// Errors
interface ApiError { status: number; error: string; message: string; [key: string]: unknown; }
```

### 2. Base Client (`client.ts`)

- Create a configured fetch wrapper that:
  - Prepends the base URL
  - Sets `Content-Type: application/json`
  - Sets auth headers from a provided UserContext
  - Parses JSON responses
  - Throws typed `ApiError` on non-2xx responses
- Export a factory: `createApiClient(baseUrl: string, userContext: HostContext)`

### 3. RCDO Client (`rcdo.ts`)

- `getTree(): Promise<RcdoTreeRallyCry[]>` — GET `/api/rcdo/tree`
- `searchOutcomes(query: string): Promise<OutcomeSearchResult[]>` — GET `/api/rcdo/outcomes/search?q=...`
- CRUD functions for Rally Cries, Defining Objectives, Outcomes (for manager hierarchy management in M4, but defined now for completeness)

### 4. Plans Client (`plans.ts`)

- `getPlan(date: string): Promise<WeeklyPlan>` — GET `/api/plans?date=...`
- `getPlanById(planId: string): Promise<WeeklyPlan>` — GET `/api/plans/{id}`
- `transitionPlan(planId: string, targetStatus: PlanStatus): Promise<WeeklyPlan>` — POST `/api/plans/{id}/transition`
- `unlockPlan(planId: string): Promise<WeeklyPlan>` — POST `/api/plans/{id}/unlock`
- `getTransitions(planId: string): Promise<PlanTransition[]>` — GET `/api/plans/{id}/transitions`

### 5. Commitments Client (`commitments.ts`)

- `listCommitments(planId: string): Promise<Commitment[]>` — GET `/api/plans/{planId}/commitments`
- `createCommitment(planId: string, req: CreateCommitmentRequest): Promise<Commitment>` — POST
- `updateCommitment(planId: string, commitmentId: string, req: UpdateCommitmentRequest): Promise<Commitment>` — PUT
- `deleteCommitment(planId: string, commitmentId: string): Promise<void>` — DELETE
- `reorderCommitments(planId: string, orderedIds: string[]): Promise<Commitment[]>` — PUT `/api/plans/{planId}/commitments/reorder`
- `reconcileCommitment(planId: string, commitmentId: string, req: { actualStatus: ActualStatus; reconciliationNotes?: string }): Promise<Commitment>` — PATCH
- `bulkReconcile(planId: string, items: ReconcileItemRequest[]): Promise<Commitment[]>` — PATCH

### 6. Tests

Test each client module with mocked fetch:
- Correct URL construction
- Auth headers present on every request
- Response typing is correct
- Error responses throw typed ApiError

## Acceptance Criteria

- [ ] All API client functions are fully typed with no `any`
- [ ] Auth headers are set on every request
- [ ] Base URL is configurable
- [ ] Error responses are parsed into `ApiError` type
- [ ] All endpoint paths match M1/M2 spec definitions exactly
- [ ] Barrel export from `frontend/src/api/index.ts` exposes all client functions

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — API client tests pass
- [ ] TypeScript compiler reports no type errors

## Stop and Ask

- If the backend uses a different response envelope (e.g., wrapping all responses in `{ data: ..., meta: ... }`), stop and ask before adjusting the types.
