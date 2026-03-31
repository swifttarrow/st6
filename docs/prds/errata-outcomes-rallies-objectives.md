# Errata: RCDO hierarchy creation in the product UI

## Purpose

This document records a **gap between the PRD’s strategic hierarchy requirements and what the shipped frontend exposes**, so future work (specs, sprints, or host-app integration) can treat hierarchy **creation** as an explicit scope item rather than an implied capability.

## PRD reference

In `prd.md`, **Strategic Hierarchy Management (RCDO)** states that the system must support full CRUD for Rally Cry → Defining Objective → Outcome, restricted to Manager or Leadership roles, with browse/search when linking commitments.

## What is implemented today

### Backend (complete for API-driven CRUD)

Authenticated **Manager** and **Leadership** roles can create, read, update, and archive hierarchy nodes via HTTP APIs. Representative create contracts:

| Entity              | Method | Path                               | Request body |
|---------------------|--------|------------------------------------|--------------|
| Rally Cry           | `POST` | `/api/rcdo/rally-cries`            | `{ "name", "description" }` |
| Defining Objective  | `POST` | `/api/rcdo/defining-objectives`   | `{ "rallyCryId", "name", "description" }` |
| Outcome             | `POST` | `/api/rcdo/outcomes`               | `{ "definingObjectiveId", "name", "description" }` |

Local and test environments typically simulate identity with headers such as `X-User-Id`, `X-User-Role` (`MANAGER` or `LEADERSHIP`), `X-Team-Id`, and `X-Manager-Id`. IC roles receive **403** on mutation endpoints.

Operational seed data can be loaded with `./seed.sh`, which exercises these endpoints.

### Frontend (read-only hierarchy for IC flows)

The IC-facing experience loads the hierarchy for **browsing and search** (e.g. tree and outcome search) so commitments can be **linked to existing outcomes**. The client API layer exposes only read operations for RCDO (tree fetch and outcome search); it does **not** call create/update/archive endpoints.

There is **no in-app UI** for managers or leaders to create Rally Cries, Defining Objectives, or Outcomes, nor to edit or archive them from the browser.

## Gap summary

| Capability                         | PRD intent | Backend | Frontend UI |
|------------------------------------|------------|---------|-------------|
| Create Rally Cry / DO / Outcome    | Yes        | Yes     | No          |
| Browse / search for linking        | Yes        | Yes     | Yes         |
| Update / archive (full CRUD in UI) | Yes        | Yes (API) | No        |

## Desired product behavior (to be specified in `docs/specs/`)

When this gap is closed, managers and leaders should be able to **maintain the RCDO hierarchy inside the module** without relying on `curl`, seed scripts, or external tools, including at minimum:

1. **Create** a Rally Cry (name + description).
2. **Create** a Defining Objective under a selected Rally Cry.
3. **Create** an Outcome under a selected Defining Objective.
4. **Refresh** the hierarchy in the UI after mutations so weekly planning and linking views stay consistent.

Follow-on work may align the UI with the rest of **CRUD** (edit, archive/unarchive) already available on the API, consistent with archive-safety rules for outcomes that have commitments.

## Implementation notes (non-authoritative)

- **Effort**: Primarily frontend (API client methods, forms or modals, role gating via `HostContext`, refetch after success). Backend create endpoints already exist.
- **Placement**: Product choice whether hierarchy admin lives on a dedicated route, manager dashboard, or an extended strategy panel.
- **Authority**: Executable work should be broken into tasks under `docs/specs/`; this errata is input only and does not replace milestone specs.

## Related specs

- `docs/specs/m1-data-foundation/` — RCDO CRUD API, tree and search, archive safety  
- `docs/specs/m3-ic-frontend/` — IC shell, weekly planning, strategy browser (linking only)
