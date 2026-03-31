# Task 002: Backend Tree Endpoint — Include Archived Support

## Purpose

The tree endpoint (`GET /api/rcdo/tree`) currently hard-filters archived items and returns no `archived` indicator on nodes. This task adds an `includeArchived` query parameter and an `archived` boolean to each node in the tree response, enabling the frontend "Show archived" toggle in Task 008.

## Inputs

- Spec: `docs/specs/m5-rcdo-management-ui/README.md`
- Files:
  - `backend/src/main/java/com/wct/rcdo/controller/RcdoTreeController.java`
  - `backend/src/main/java/com/wct/rcdo/service/RcdoTreeService.java`
  - `backend/src/main/java/com/wct/rcdo/dto/RcdoTreeResponse.java`
  - `backend/src/main/java/com/wct/rcdo/repository/RallyCryRepository.java`
  - `backend/src/main/java/com/wct/rcdo/repository/DefiningObjectiveRepository.java`
  - `backend/src/main/java/com/wct/rcdo/repository/OutcomeRepository.java`

## Outputs

- Modify: `backend/src/main/java/com/wct/rcdo/controller/RcdoTreeController.java`
- Modify: `backend/src/main/java/com/wct/rcdo/service/RcdoTreeService.java`
- Modify: `backend/src/main/java/com/wct/rcdo/dto/RcdoTreeResponse.java`
- Possibly modify repository interfaces if `findAllOrderBySortOrder()` (without archived filter) methods do not already exist

## Dependencies

- Prior task: `001-reconcile-types-and-add-mutations.md` (frontend types already include `archived?: boolean` on tree nodes)

## Constraints

- Default behavior must not change: `GET /api/rcdo/tree` (no param) must return only active items, same as today
- The `archived` boolean field must be present on all tree nodes regardless of the `includeArchived` param value
- No new dependencies or migrations

## Required Changes

### 1. Add `archived` field to tree response DTOs in `RcdoTreeResponse.java`

Add a `boolean archived` field to:
- `RcdoTreeResponse` (Rally Cry level) — derived from `archivedAt != null`
- `RcdoTreeResponse.DefiningObjectiveNode` — derived from `archivedAt != null`
- `RcdoTreeResponse.OutcomeNode` — derived from `archivedAt != null`

### 2. Update `RcdoTreeController.getTree()`

Add an optional query parameter:

```java
@GetMapping("/tree")
public List<RcdoTreeResponse> getTree(
        @RequestParam(defaultValue = "false") boolean includeArchived) {
    return treeService.getTree(includeArchived);
}
```

### 3. Update `RcdoTreeService.getTree()`

Change the method signature to `getTree(boolean includeArchived)`.

When `includeArchived` is `true`, fetch all entities (including archived) from each repository. When `false`, use the existing `findByArchivedAtIsNullOrderBySortOrder()` methods.

The repositories likely already have `findAllOrderBySortOrder()` or similar methods (check the `findAll` variants). If not, add them:
- `RallyCryRepository`: `List<RallyCry> findAllByOrderBySortOrder()`
- `DefiningObjectiveRepository`: `List<DefiningObjective> findAllByOrderBySortOrder()`
- `OutcomeRepository`: `List<Outcome> findAllByOrderBySortOrder()`

Update the `toResponse` mapping to populate the new `archived` field as `entity.getArchivedAt() != null`.

### 4. Update existing tests

If there are existing tests for the tree endpoint (look in `backend/src/test/java/com/wct/rcdo/controller/`), verify they still pass. The default behavior (no param) must remain unchanged.

## Acceptance Criteria

- [ ] `GET /api/rcdo/tree` (no param) returns only active items, each with `"archived": false`
- [ ] `GET /api/rcdo/tree?includeArchived=true` returns all items including archived, with correct `archived` values
- [ ] Every node at all three levels (Rally Cry, Defining Objective, Outcome) includes the `archived` boolean field
- [ ] Existing tree endpoint tests pass without modification (default behavior unchanged)
- [ ] Backend compiles and tests pass: `cd backend && ./mvnw test`

## Validation

- [ ] `cd backend && ./mvnw test` exits 0
- [ ] `curl http://localhost:8080/api/rcdo/tree` — response includes `"archived": false` on all nodes
- [ ] Create and archive a Rally Cry via API, then `curl http://localhost:8080/api/rcdo/tree?includeArchived=true` — archived item appears with `"archived": true`
- [ ] `curl http://localhost:8080/api/rcdo/tree` (no param) — archived item does NOT appear

## Stop and Ask

- If the tree response uses Java records and adding a field requires changing all construction sites, check how many call sites exist before proceeding — if more than 3, consider a builder pattern instead
