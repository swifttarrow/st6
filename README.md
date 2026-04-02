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

1. **Backend** (from `backend/`): run the Spring Boot app (default API on port `8080`).
2. **Frontend** (from `frontend/`): `npm install` then `npm run dev`, with the API proxied to `http://localhost:8080` (see `frontend/vite.config.ts`).
3. Optional: with the backend up, run `./seed.sh` from the repo root to load sample RCDO data and plans (requires `curl` and `jq`).

Product context and specs live under `docs/prds/` and `docs/specs/`.
