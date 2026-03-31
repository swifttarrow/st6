# Task 003: RCDO Hierarchy CRUD API

## Purpose

Implement the REST API endpoints for creating, reading, updating, and archiving Rally Cries, Defining Objectives, and Outcomes. These endpoints are the primary management interface for the strategic hierarchy and are restricted to Manager and Leadership roles.

## Inputs

- Spec: `docs/specs/m1-data-foundation/README.md`
- Files: Migration files from `002-database-schema.md`
- Files: `backend/src/main/java/com/wct/WctApplication.java` (from Task 001)

## Outputs

- Create: `backend/src/main/java/com/wct/rcdo/RallyCryController.java`
- Create: `backend/src/main/java/com/wct/rcdo/DefiningObjectiveController.java`
- Create: `backend/src/main/java/com/wct/rcdo/OutcomeController.java`
- Create: `backend/src/main/java/com/wct/rcdo/RallyCryService.java`
- Create: `backend/src/main/java/com/wct/rcdo/DefiningObjectiveService.java`
- Create: `backend/src/main/java/com/wct/rcdo/OutcomeService.java`
- Use: `backend/src/main/java/com/wct/rcdo/entity/RallyCry.java` (created in Task 002)
- Use: `backend/src/main/java/com/wct/rcdo/entity/DefiningObjective.java` (created in Task 002)
- Use: `backend/src/main/java/com/wct/rcdo/entity/Outcome.java` (created in Task 002)
- Create: `backend/src/main/java/com/wct/rcdo/repository/RallyCryRepository.java`
- Create: `backend/src/main/java/com/wct/rcdo/repository/DefiningObjectiveRepository.java`
- Create: `backend/src/main/java/com/wct/rcdo/repository/OutcomeRepository.java`
- Create: `backend/src/main/java/com/wct/rcdo/dto/CreateRallyCryRequest.java` — `{ name: String, description: String }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/UpdateRallyCryRequest.java` — `{ name: String, description: String, sortOrder: int }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/RallyCryResponse.java` — `{ id, name, description, sortOrder, archivedAt, createdAt, updatedAt }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/CreateDefiningObjectiveRequest.java` — `{ rallyCryId: UUID, name: String, description: String }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/UpdateDefiningObjectiveRequest.java` — `{ name: String, description: String, sortOrder: int }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/DefiningObjectiveResponse.java` — `{ id, rallyCryId, name, description, sortOrder, archivedAt, createdAt, updatedAt }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/CreateOutcomeRequest.java` — `{ definingObjectiveId: UUID, name: String, description: String }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/UpdateOutcomeRequest.java` — `{ name: String, description: String, sortOrder: int }`
- Create: `backend/src/main/java/com/wct/rcdo/dto/OutcomeResponse.java` — `{ id, definingObjectiveId, name, description, sortOrder, archivedAt, createdAt, updatedAt }`
- Create: `backend/src/main/java/com/wct/auth/UserContext.java` — interface for extracting user identity from requests
- Create: `backend/src/main/java/com/wct/auth/UserContextFilter.java` — servlet filter that parses user context from request headers
- Create: `backend/src/main/java/com/wct/auth/RoleGuard.java` — annotation or interceptor for role-based access
- Create: `backend/src/test/java/com/wct/rcdo/RallyCryControllerTest.java`
- Create: `backend/src/test/java/com/wct/rcdo/DefiningObjectiveControllerTest.java`
- Create: `backend/src/test/java/com/wct/rcdo/OutcomeControllerTest.java`
- Side effects: none

## Dependencies

- Prior task: `002-database-schema.md`
- Required artifacts: All migration files applied (tables exist), JPA entities for RallyCry, DefiningObjective, Outcome (created in Task 002)

## Constraints

- Only users with role MANAGER or LEADERSHIP may create, update, or archive hierarchy nodes. IC users receive HTTP 403.
- User context is extracted from request headers. For this milestone, use a simple header-based approach: `X-User-Id`, `X-User-Role`, `X-Team-Id`, `X-Manager-Id`. This will be replaced with the actual host-app auth mechanism in M3.
- Archive (soft-delete) sets `archived_at` to current timestamp. A subsequent unarchive sets it back to null.
- All list endpoints exclude archived nodes by default. An optional `?includeArchived=true` query param includes them.
- Responses must include the entity's full data including timestamps.
- Creating a Defining Objective requires a valid `rallyCryId`. Creating an Outcome requires a valid `definingObjectiveId`.
- If a parent node is archived, its children remain accessible but should be flagged as having an archived parent.
- POST/PUT requests with missing required fields (e.g., blank name) return 400 Bad Request with field-level error details.
- Invalid UUID format in path params or request body returns 400 Bad Request.
- Creating a child with a non-existent parent ID returns 404 Not Found.
- Unarchive is always allowed and sets `archived_at` to null. No cascade logic.

## Required Changes

### 1. User Context Infrastructure

Create `UserContext` as a record/interface:
```
{ userId: String, role: enum(IC, MANAGER, LEADERSHIP), teamId: String, managerId: String? }
```

Create `UserContextFilter` that reads `X-User-Id`, `X-User-Role`, `X-Team-Id`, `X-Manager-Id` headers and stores a `UserContext` in a request attribute or thread-local.

Create `RoleGuard` — a mechanism (annotation + interceptor, or explicit check in service layer) that returns 403 if the current user's role is not in the allowed set.

### 2. JPA Entities

Create JPA entity classes for `RallyCry`, `DefiningObjective`, `Outcome` mapping to the tables from Task 002. Use UUID `@Id` with auto-generation.

### 3. Repositories

Create Spring Data JPA repositories for each entity. Include query methods:
- `findByArchivedAtIsNullOrderBySortOrder()` — list active nodes
- `findByArchivedAtIsNotNullOrderBySortOrder()` — list archived nodes (if needed)

For `DefiningObjective`: `findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(UUID rallyCryId)`
For `Outcome`: `findByDefiningObjectiveIdAndArchivedAtIsNullOrderBySortOrder(UUID definingObjectiveId)`

### 4. REST Endpoints

**Rally Cry** — base path: `/api/rcdo/rally-cries`
- `POST /` — Create. Body: `{ name, description }`. Returns 201 + created entity.
- `GET /` — List all active. Optional `?includeArchived=true`. Returns 200 + array.
- `GET /{id}` — Get by ID. Returns 200 or 404.
- `PUT /{id}` — Update. Body: `{ name, description, sortOrder }`. Returns 200 + updated entity.
- `PATCH /{id}/archive` — Archive. Returns 200.
- `PATCH /{id}/unarchive` — Unarchive. Returns 200.

**Defining Objective** — base path: `/api/rcdo/defining-objectives`
- `POST /` — Create. Body: `{ rallyCryId, name, description }`. Returns 201.
- `GET /?rallyCryId={id}` — List by Rally Cry. Returns 200 + array.
- `GET /{id}` — Get by ID. Returns 200 or 404.
- `PUT /{id}` — Update. Body: `{ name, description, sortOrder }`. Returns 200.
- `PATCH /{id}/archive` — Archive. Returns 200.
- `PATCH /{id}/unarchive` — Unarchive. Returns 200.

**Outcome** — base path: `/api/rcdo/outcomes`
- `POST /` — Create. Body: `{ definingObjectiveId, name, description }`. Returns 201.
- `GET /?definingObjectiveId={id}` — List by Defining Objective. Returns 200 + array.
- `GET /{id}` — Get by ID. Returns 200 or 404.
- `PUT /{id}` — Update. Body: `{ name, description, sortOrder }`. Returns 200.
- `PATCH /{id}/archive` — Archive. Returns 200.
- `PATCH /{id}/unarchive` — Unarchive. Returns 200.

All mutating endpoints (POST, PUT, PATCH) require MANAGER or LEADERSHIP role. GET endpoints are accessible to all authenticated users.

### 5. Tests

Write integration tests (Spring Boot `@WebMvcTest` or `@SpringBootTest`) for each controller covering:
- Happy-path CRUD operations
- 403 when IC attempts a mutation
- 404 when accessing non-existent ID
- Archived nodes excluded from default list, included with `?includeArchived=true`
- Creating a child with an invalid parent ID returns 400 or 404

## Acceptance Criteria

- [ ] `POST /api/rcdo/rally-cries` creates a Rally Cry and returns 201 with the entity
- [ ] `GET /api/rcdo/rally-cries` returns only non-archived Rally Cries by default
- [ ] `GET /api/rcdo/rally-cries?includeArchived=true` includes archived entries
- [ ] `PATCH /api/rcdo/rally-cries/{id}/archive` sets `archived_at` and returns 200
- [ ] Same CRUD pattern works for Defining Objectives and Outcomes
- [ ] Creating a Defining Objective with a non-existent `rallyCryId` returns 400/404
- [ ] An IC user (role=IC in header) calling POST returns 403
- [ ] A Manager user calling POST returns 201
- [ ] A Leadership user calling POST returns 201
- [ ] All responses include `id`, `name`, `description`, `sortOrder`, `archivedAt`, `createdAt`, `updatedAt`

## Validation

- [ ] `cd backend && ./gradlew test` — all RCDO controller tests pass
- [ ] Manual test: start app, POST a Rally Cry with `X-User-Role: MANAGER`, verify 201
- [ ] Manual test: POST with `X-User-Role: IC`, verify 403

## Stop and Ask

- If the host app's auth mechanism is known to use a specific token format (e.g., JWT with specific claims), stop and ask before implementing the header-based approach, to avoid throwaway work.
