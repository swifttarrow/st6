# Weekly Commitment Tracker

A weekly planning module that ties individual contributors’ commitments to the organization’s strategic hierarchy (Rally Cries → Defining Objectives → Outcomes), with a full plan-to-reconciliation lifecycle for ICs, managers, and leadership.

## Live app

**Production:** [https://wct-weekly-commitment-tracker-production.up.railway.app](https://wct-weekly-commitment-tracker-production.up.railway.app)

## Demo

A narrated walkthrough of the product is in the repo root:

- [`demo narration.mp4`](./demo%20narration.mp4)

## Stack

- **Frontend:** React, TypeScript, Vite (`frontend/`)
- **Backend:** Spring Boot (`backend/`)
- **Deploy:** Single Docker image (SPA served from the API); configured for [Railway](https://railway.app/) via `Dockerfile` and `railway.toml`

## Local development

1. **Start PostgreSQL** from the repo root: `docker compose up -d postgres`
2. **Backend** (from `backend/`): `SPRING_PROFILES_ACTIVE=local-postgres APP_AUTH_HMAC_SECRET=local-dev-jwt-secret-0123456789abcdef ./gradlew bootRun`
3. **Frontend remote** (from `frontend/`): `npm install` then `npm run dev`
4. **Host-shell demo** (from `frontend/`): `npm run dev:host-demo` to open the host integration page at `/host-demo.html`
5. Optional richer sample data: use [`backend/scripts/seed.sh`](./backend/scripts/seed.sh) after the Postgres container is healthy. The old repo-root `seed.sh` is from the earlier header-auth prototype and is no longer the recommended path.

Notes:

- Local development is now Postgres-first so queries and Flyway migrations behave more like production.
- Automated tests still use the default in-memory H2 profile for speed and isolation.
- Override local DB connection settings with `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` if you are not using the bundled Compose service.

## Authentication

- **All environments:** the backend now authenticates API requests with Bearer JWTs only. Browser-supplied identity headers are no longer accepted.
- **Local development:** the standalone Vite page no longer offers a local login picker. Mount the micro-frontend from a host app or inject `window.__WCT_HOST_CONTEXT__` with a valid JWT-backed context before loading [`frontend/index.html`](./frontend/index.html).
- **Backend JWT config:** provide either standard Spring resource-server JWT configuration (`issuer-uri` / `jwk-set-uri`) or an `app.auth.hmac-secret` value for local/test signing.
- **Host-shell demo mode:** set `APP_DEMO_HOST_ENABLED=true` alongside `APP_AUTH_HMAC_SECRET=...` to expose a demo-only `/demo-host/context` endpoint that mints local review tokens for the host shell.
- **Expected JWT claims by default:** `sub` (user ID), `role`, `team_id`, `manager_id`, and `direct_reports`. Claim names are configurable in [backend/src/main/resources/application.yml](./backend/src/main/resources/application.yml).
- **Micro-frontend host contract:** the exported `HostContext` now requires an `accessToken` for authenticated API calls and supports optional `directReportIds` for manager UI defaults.

## Host demo

This repo includes a lightweight host-shell demonstration so reviewers can see the micro-frontend mounted the way a real PA host app would.

1. Start the backend:
   `docker compose up -d postgres`
   `cd backend && SPRING_PROFILES_ACTIVE=local-postgres APP_AUTH_HMAC_SECRET=local-dev-jwt-secret-0123456789abcdef APP_DEMO_HOST_ENABLED=true ./gradlew bootRun`
2. Start the frontend host demo:
   `cd frontend && npm install && npm run dev:host-demo`
3. Open `http://localhost:5173/host-demo.html`

What the demo shows:

- The host shell requests `/demo-host/context?persona=...`
- The backend returns a JWT-backed host context for IC, manager, or leadership review personas
- The host shell calls the exported `mount(container, context)` contract
- The remote runs inside a memory router so the host keeps control of the top-level URL

The demo endpoint is intentionally local-only scaffolding for assignment review. It is not part of the production auth story.

Product context and specs live under `docs/prds/` and `docs/specs/`.
