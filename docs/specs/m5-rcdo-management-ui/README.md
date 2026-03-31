# Milestone 5: RCDO Management UI

## Outcome

Managers and Leadership users can create, edit, and archive Rally Cries, Defining Objectives, and Outcomes entirely from the browser, eliminating the need for `curl`, seed scripts, or external tooling. The RCDO hierarchy admin lives on a dedicated `/strategy` route gated to MANAGER and LEADERSHIP roles.

## Scope

- Reconcile existing frontend RCDO types with actual backend JSON shapes
- One small backend change: add `includeArchived` support to the tree endpoint
- New `/strategy` route and page for RCDO hierarchy management
- Sidebar navigation entry visible to MANAGER and LEADERSHIP roles
- API client methods for RCDO create, update, archive, and unarchive
- Create forms (inline) for Rally Cry, Defining Objective, and Outcome
- Inline editing of name and description for existing nodes
- Archive and unarchive actions with confirmation
- "Show archived" toggle on the strategy page
- Automatic tree refetch after any mutation
- Role guard redirecting IC users away from `/strategy`

## Out of Scope

- Reordering (sortOrder) via drag-and-drop in the admin tree
- Hard delete of RCDO nodes (backend only supports archive)
- Bulk operations (multi-select archive)
- Moving a Defining Objective to a different Rally Cry, or an Outcome to a different Defining Objective
- Changes to the IC-facing StrategyBrowser component beyond the field rename fix

## Source Inputs

- Errata: `docs/prds/errata-outcomes-rallies-objectives.md`
- Existing spec: `docs/specs/m1-data-foundation/003-rcdo-crud-api.md` (backend contract)
- Existing spec: `docs/specs/m3-ic-frontend/002-api-client.md` (API client pattern)

## Constraints

- Mutation endpoints already exist on the backend; one backend change is required (tree endpoint `includeArchived` support)
- Frontend must use the existing `ApiClient` pattern (`frontend/src/api/client.ts`) and HostContext header injection
- Role gating in the UI must mirror backend enforcement: only MANAGER and LEADERSHIP roles may access mutation endpoints
- Forms must validate that `name` is non-empty before submission (backend enforces this; frontend should prevent the round-trip)
- After any successful mutation, the tree must be refetched so all views stay consistent
- The design must use existing CSS tokens from `frontend/src/styles/tokens.css` and follow existing component conventions (CSS Modules, lucide-react icons, data-testid attributes)
- Only one create form may be open at a time across all node types; opening any create form closes all others

## Decisions

- RCDO management lives on a dedicated `/strategy` route (not embedded in the manager dashboard or a modal)
- The page renders the full hierarchy tree with inline action buttons, not a separate list/detail layout
- Archive actions for Outcomes with active commitments will show a warning but still allow archiving (backend enforces safety rules)
- "Show archived" toggle defaults to off; when on, archived items appear with a visual indicator
- Frontend RCDO types will be corrected to match actual backend JSON field names (`name` not `title`, `archivedAt` not `archived`)

## Assumptions

- The backend archive-safety endpoint returns a clear error (409 Conflict) if an archive operation is blocked, and the frontend will surface that error message directly

## Task Order

1. `001-reconcile-types-and-add-mutations.md` — Fix existing frontend RCDO types to match backend JSON shapes, update all component references, and add mutation API methods. This unblocks everything.
2. `002-backend-tree-include-archived.md` — Add `includeArchived` query param and `archived` field to the tree endpoint. Required by Task 008.
3. `003-strategy-route-and-page-shell.md` — Add the `/strategy` route, page component, sidebar entry, and role guard. Renders the tree read-only.
4. `004-create-rally-cry.md` — Add "New Rally Cry" inline form on the strategy page.
5. `005-create-defining-objective.md` — Add "New Defining Objective" form under a selected Rally Cry.
6. `006-create-outcome.md` — Add "New Outcome" form under a selected Defining Objective. Extract reusable node sub-component.
7. `007-inline-edit.md` — Add inline edit for name and description on all three node types.
8. `008-archive-and-unarchive.md` — Add archive, unarchive, and "Show archived" toggle.
9. `009-tests.md` — Unit and integration tests for all new and modified code.

## Milestone Success Criteria

- A MANAGER user navigating to `/strategy` sees the full RCDO tree and can create a Rally Cry, a Defining Objective under it, and an Outcome under that
- After creation, the tree updates without a full page reload
- A MANAGER user can edit the name/description of any node and archive/unarchive it
- An IC user navigating to `/strategy` is redirected to `/my-week`
- "Show archived" toggle reveals archived items with distinct styling
- All existing components (StrategyBrowser, CommitmentForm, CommitmentRow, ReconciliationTable) continue working after the type rename
- All new components have passing tests

## Milestone Validation

- `cd frontend && npx vitest run` passes with no failures
- `cd backend && ./mvnw test` passes with no failures (for Task 002)
- Manual: open the app as MANAGER, navigate to `/strategy`, create a Rally Cry, create a Defining Objective under it, create an Outcome under that, edit each, archive each, toggle "Show archived" to verify they reappear, unarchive one
- Manual: open the app as IC, verify `/strategy` redirects to `/my-week`

## Risks / Follow-ups

- Sort order management is deferred to a future milestone
