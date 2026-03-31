# Task 004: RCDO Tree Browsing and Search API

## Purpose

Implement the hierarchy tree endpoint and search endpoint that power the Strategy Hierarchy browser panel in the IC Weekly Planning screen. ICs need to browse the full Rally Cry > Defining Objective > Outcome tree and search by name to link commitments to Outcomes.

## Inputs

- Spec: `docs/specs/m1-data-foundation/README.md`
- Files: Entity classes, repositories, and services from `003-rcdo-crud-api.md`
- Design reference: `st6.pen` frame `K3Xao` — left panel showing a collapsible tree with Rally Cry > Defining Objective > Outcome nodes

## Outputs

- Create: `backend/src/main/java/com/wct/rcdo/RcdoTreeController.java`
- Create: `backend/src/main/java/com/wct/rcdo/RcdoTreeService.java`
- Create: `backend/src/main/java/com/wct/rcdo/dto/RcdoTreeResponse.java` — nested tree DTO
- Create: `backend/src/main/java/com/wct/rcdo/dto/RcdoSearchResult.java` — flat search result DTO
- Create: `backend/src/test/java/com/wct/rcdo/RcdoTreeControllerTest.java`
- Side effects: none

## Dependencies

- Prior task: `003-rcdo-crud-api.md`
- Required artifacts: JPA entities, repositories for RallyCry, DefiningObjective, Outcome

## Constraints

- Tree endpoint returns all active (non-archived) nodes in a single nested response. No pagination — hierarchy is expected to be <1,000 nodes.
- Search endpoint returns a flat list of Outcomes matching a name substring, each annotated with its parent Defining Objective name and Rally Cry name for display context.
- Both endpoints are accessible to all authenticated users (IC, Manager, Leadership).
- Results are ordered by `sort_order` at each level.

## Required Changes

### 1. Tree Endpoint

`GET /api/rcdo/tree`

Returns the full hierarchy as a nested structure:

```json
[
  {
    "id": "uuid",
    "name": "Rally Cry Name",
    "description": "...",
    "definingObjectives": [
      {
        "id": "uuid",
        "name": "Defining Objective Name",
        "description": "...",
        "outcomes": [
          {
            "id": "uuid",
            "name": "Outcome Name",
            "description": "..."
          }
        ]
      }
    ]
  }
]
```

- Fetch all active Rally Cries ordered by `sort_order`
- For each, fetch active Defining Objectives ordered by `sort_order`
- For each, fetch active Outcomes ordered by `sort_order`
- Optimize: use eager fetching or batch queries to avoid N+1 (e.g., fetch all DOs for all active RCs in one query, then group in-memory)

### 2. Search Endpoint

`GET /api/rcdo/outcomes/search?q={query}`

Returns a flat list of active Outcomes whose name contains the query string (case-insensitive):

```json
[
  {
    "outcomeId": "uuid",
    "outcomeName": "Outcome Name",
    "definingObjectiveId": "uuid",
    "definingObjectiveName": "DO Name",
    "rallyCryId": "uuid",
    "rallyCryName": "RC Name"
  }
]
```

- Minimum query length: 1 character. Return 400 if `q` is empty or missing.
- Case-insensitive substring match on `outcome.name`.
- Join through defining_objective and rally_cry to include parent names.
- Exclude archived outcomes, and outcomes whose parent DO or RC is archived.
- Order results by rally_cry.sort_order, defining_objective.sort_order, outcome.sort_order.

### 3. Tests

Write integration tests covering:
- Tree endpoint returns correct nested structure with multiple RCs, DOs, and Outcomes
- Tree endpoint excludes archived nodes at all levels
- Search returns matching outcomes with parent context
- Search with empty query returns 400
- Search excludes outcomes under archived parents
- Search is case-insensitive

## Acceptance Criteria

- [ ] `GET /api/rcdo/tree` returns a nested JSON array of Rally Cries > Defining Objectives > Outcomes
- [ ] Archived nodes at any level are excluded from the tree
- [ ] `GET /api/rcdo/outcomes/search?q=oauth` returns matching Outcomes with parent RC and DO names
- [ ] Search is case-insensitive
- [ ] Search excludes Outcomes whose parent DO or RC is archived
- [ ] Empty or missing `q` parameter returns 400
- [ ] Results at each tree level are ordered by `sort_order`

## Validation

- [ ] `cd backend && ./gradlew test` — all tree and search tests pass
- [ ] Manual test: create a hierarchy via CRUD endpoints, then verify tree and search return expected structure

## Stop and Ask

- If the hierarchy is expected to be significantly larger than 1,000 nodes (e.g., multi-tenant or shared across orgs), stop and ask about pagination requirements before implementing.
