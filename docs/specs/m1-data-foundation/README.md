# Milestone 1: Data Foundation & RCDO API

## Outcome

A running backend service with a fully migrated database schema and a complete RCDO hierarchy CRUD API. After this milestone, Rally Cries, Defining Objectives, and Outcomes can be created, read, updated, and archived through authenticated endpoints with role-based access control. The database schema also includes the weekly plan and commitment tables needed by M2, so that M2 can begin without schema redesign.

## Scope

- Project scaffolding (Java 21 backend, TypeScript strict frontend shell, SQL migrations)
- Full database schema for RCDO hierarchy, weekly plans, and commitments
- RCDO hierarchy CRUD API (Rally Cry, Defining Objective, Outcome)
- Role-based access control: only Manager and Leadership roles may mutate the hierarchy
- Archive-safe deletion: prevent deleting Outcomes with active commitments; support archiving
- Hierarchy browsing and search endpoint for the IC linking experience

## Out of Scope

- Weekly commitment CRUD and lifecycle (M2)
- All frontend screens (M3, M4)
- Notifications, historical trend analytics, 15-Five migration (deferred per PRD)

## Source Inputs

- PRD: `docs/prd.md` (sections: Strategic Hierarchy Management, Constraints, System Behavior and Edge Cases)
- Design: `st6.pen` frame `K3Xao` — Strategy Hierarchy browser panel (tree structure: Rally Cry > Defining Objective > Outcome)

## Constraints

- **Language**: Java 21 for backend, SQL for migrations, TypeScript (strict mode) for frontend shell
- **Data Isolation**: All tables owned by this module; no shared tables with other modules
- **User Identity**: User ID, role (IC, Manager, Leadership), and reporting relationships are provided by the host application. The backend must accept these via a request context mechanism (e.g., auth header/token). This milestone defines the contract but does not implement host-app integration.
- **Week Boundaries**: Weeks run Monday 00:00 UTC through Friday 23:59 UTC

## Decisions

- The RCDO hierarchy is single-tenant (one hierarchy for the entire org)
- Hierarchy nodes use soft-delete (archived flag) rather than hard delete, preserving historical references
- The weekly_plan table uses a composite of (user_id, week_start_date) as its logical key, where week_start_date is always a Monday
- The weekly_plan table includes `team_id` (nullable VARCHAR, set from UserContext on plan creation) for cross-team aggregation in M4 leadership views
- Priority on commitments is stored as an integer rank (1 = highest priority)
- Actual status on commitments is an enum: COMPLETED, PARTIALLY_COMPLETED, NOT_STARTED, DROPPED
- All foreign keys use RESTRICT (no cascade deletes) to preserve historical data
- Task 002 creates full JPA entities for all tables (including WeeklyPlan, Commitment) so downstream milestones don't need to recreate them

## Assumptions

- The host application provides user identity via a mechanism that can be parsed into {userId, role, teamId, managerId}. The exact transport (JWT, header, etc.) will be defined in Task 002 as a pluggable interface so M3/M4 can finalize it.
- The RCDO hierarchy is expected to contain fewer than 1,000 total nodes. Search is name-based substring matching, not full-text search.

## Task Order

1. `001-project-scaffolding.md` — Establishes the monorepo structure, build tooling, and dev dependencies. Everything else depends on this.
2. `002-database-schema.md` — Creates all SQL migration files. The schema must exist before any API code.
3. `003-rcdo-crud-api.md` — Implements RCDO hierarchy CRUD endpoints with role guards.
4. `004-rcdo-tree-and-search-api.md` — Implements the hierarchy tree browsing and search endpoint used by the IC linking UI.
5. `005-archive-safety.md` — Implements archive/delete safety checks: prevent deletion of Outcomes with active commitments, cascade visibility rules.

## Milestone Success Criteria

- All database migrations run cleanly on a fresh database
- RCDO CRUD endpoints return correct responses for create, read, update, archive operations
- Non-Manager/Leadership users receive 403 when attempting hierarchy mutations
- The tree endpoint returns the full Rally Cry > Defining Objective > Outcome hierarchy
- Search endpoint returns filtered results by name substring
- Attempting to delete an Outcome with active commitments returns a 409 with affected commitment details

## Milestone Validation

- Database migrations apply without error: `./gradlew flywayMigrate` (or equivalent migration command)
- API tests pass: `./gradlew test`
- Manual curl/httpie verification of CRUD and tree endpoints against a running local instance

## Risks / Follow-ups

- The exact auth token contract with the PA host app is undefined. Task 002 introduces a pluggable `UserContext` interface that M3 will finalize when the micro-frontend integration is built.
- If the RCDO hierarchy grows beyond ~1,000 nodes, the search endpoint may need pagination or indexing. Not expected for first release.
