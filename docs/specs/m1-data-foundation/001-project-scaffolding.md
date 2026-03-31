# Task 001: Project Scaffolding

## Purpose

Establish the monorepo structure, build tooling, and development configuration for both the Java 21 backend and the TypeScript strict-mode frontend shell. This is the foundation every subsequent task builds on.

## Inputs

- Spec: `docs/specs/m1-data-foundation/README.md`
- PRD constraints: TypeScript (strict mode), Java 21, SQL, micro-frontend integration into PA host app

## Outputs

- Create: `backend/` — Java 21 project with Gradle build
- Create: `backend/build.gradle` (or `build.gradle.kts`) — with Spring Boot 3.x, Flyway, and test dependencies
- Create: `backend/src/main/java/com/wct/WctApplication.java` — Spring Boot entry point
- Create: `backend/src/main/resources/application.yml` — datasource config (H2 for dev, PostgreSQL-compatible for prod)
- Create: `backend/src/test/java/com/wct/WctApplicationTests.java` — context-loads smoke test
- Create: `frontend/` — TypeScript project with strict mode
- Create: `frontend/tsconfig.json` — with `"strict": true`
- Create: `frontend/package.json` — with build/dev scripts
- Create: `frontend/src/index.ts` — micro-frontend entry point placeholder that exports a mount function
- Side effects: none

## Dependencies

- Prior task: none

## Constraints

- Java version must be 21. Set `sourceCompatibility` and `targetCompatibility` to 21.
- TypeScript must use `"strict": true` in `tsconfig.json`.
- The backend must use Flyway for database migrations (configured but no migration files yet — those come in Task 002).
- The frontend is a shell only in this task — no UI components yet. It must export a `mount(container: HTMLElement, context: HostContext): void` function signature where `HostContext` includes at minimum `{ userId: string; role: 'IC' | 'MANAGER' | 'LEADERSHIP'; managerId?: string; teamId: string }`.
- Use Gradle (Kotlin DSL preferred) for the backend build.
- Use a standard module bundler (Vite, webpack, or Rspack) configured for module federation or remote entry output — the specific bundler choice is open but must support the PA host app's remote module pattern.

## Required Changes

1. Create `backend/` directory with a Gradle-based Spring Boot 3.x project targeting Java 21.
2. Add dependencies: Spring Boot Web, Spring Boot Data JPA, Flyway Core, H2 (dev), PostgreSQL driver, Spring Boot Test, JUnit 5.
3. Create `application.yml` with a dev profile using H2 in-memory database and a default profile placeholder for PostgreSQL.
4. Create the Spring Boot application class and a smoke test.
5. Create `frontend/` directory with `package.json`, `tsconfig.json` (strict: true), and a bundler config.
6. Create `frontend/src/index.ts` exporting the `mount` function with `HostContext` type.
7. Create `frontend/src/types/host-context.ts` defining the `HostContext` interface.

## Acceptance Criteria

- [ ] `cd backend && ./gradlew build` compiles without errors
- [ ] `cd backend && ./gradlew test` passes the context-loads smoke test
- [ ] `cd frontend && npm install && npm run build` compiles without errors
- [ ] `frontend/tsconfig.json` has `"strict": true`
- [ ] `backend/build.gradle.kts` targets Java 21
- [ ] `frontend/src/types/host-context.ts` exports `HostContext` with `userId`, `role`, `managerId?`, `teamId`
- [ ] `frontend/src/index.ts` exports a `mount` function accepting `(HTMLElement, HostContext)`

## Validation

- [ ] `cd backend && ./gradlew build` exits 0
- [ ] `cd backend && ./gradlew test` exits 0
- [ ] `cd frontend && npm run build` exits 0
- [ ] `grep -q '"strict": true' frontend/tsconfig.json`

## Stop and Ask

- If the PA host app's remote module pattern requires a specific bundler or module federation plugin version, stop and ask rather than guessing the configuration.
