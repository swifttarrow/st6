# Milestone 3: IC Frontend

## Outcome

A working micro-frontend module integrated into the PA host app shell, containing the two primary IC screens: Weekly Planning and Reconciliation. After this milestone, ICs can browse the RCDO hierarchy, create and prioritize commitments, transition through the weekly lifecycle, reconcile with actual statuses, and see carry-forward items — all through the UI.

## Scope

- Micro-frontend shell integration with host app context (user identity, role, reporting relationships)
- Shared layout: sidebar navigation, page header with state badge
- IC Weekly Planning screen (design: `st6.pen` frame `K3Xao`)
- IC Reconciliation screen (design: `st6.pen` frame `69svb`)
- API client layer connecting frontend to M1/M2 backend endpoints
- Design system tokens: colors, typography, spacing per the .pen file

## Out of Scope

- Manager Dashboard and Leadership View (M4)
- Backend changes (M1/M2 APIs are complete)
- Notifications, trend analytics (deferred per PRD)

## Source Inputs

- PRD: `docs/prd.md` (all IC-facing sections)
- Spec: `docs/specs/m1-data-foundation/README.md`, `docs/specs/m2-weekly-lifecycle/README.md`
- Design: `st6.pen` frames `K3Xao` (IC Weekly Planning) and `69svb` (IC Reconciliation)

## Design System (from .pen file)

### Colors
- Primary red: `#E42313`
- Text primary: `#0D0D0D`
- Text secondary: `#7A7A7A`
- Border: `#E8E8E8`
- Background: `#FAFAFA`
- Surface: `#FFFFFF`
- Success green: `#22C55E`
- Alert red background: `#FEF2F2`

### Typography
- Headings/nav: Space Grotesk
  - Page title: 40px, weight 500, letter-spacing -1px
  - Section heading: 18px, weight 600
  - Nav label: 14px, weight 500 (active) / 400 (inactive)
- Body: Inter
  - Body text: 13px
  - Labels/captions: 12px

### Layout
- Sidebar: 240px fixed width, 32px padding, white background, 1px right border
- Main content: remaining width, 40px top/bottom + 48px left/right padding, 32px gap between sections
- Stat cards: 28px padding, 1px border
- Table rows: 16px vertical / 20px horizontal padding, 1px bottom border
- Badges: 4px vertical / 10px horizontal padding, 1px border

### Icons
- Lucide icon font family (calendar, users, trending-up, history, lock, plus, check, edit, trash, chevrons, info)

## Constraints

- TypeScript strict mode
- The micro-frontend must mount via the `mount(container: HTMLElement, context: HostContext)` function defined in M1 Task 001
- `HostContext` provides: userId, role, managerId, teamId
- All API calls use the backend endpoints defined in M1/M2 specs
- The frontend must work within the PA host app's remote module pattern

## Decisions

- Use React as the UI framework (standard for micro-frontends in module federation patterns)
- Use CSS custom properties for design tokens, allowing host-app theme overrides
- Sidebar nav items are role-gated: ICs see only IC items; Manager/Leadership see additional items linking to placeholder pages
- Drag-and-drop reordering uses `@dnd-kit/core` + `@dnd-kit/sortable`; falls back to up/down buttons if dnd-kit conflicts with host app
- Stale-week detection uses client-local time (acceptable approximation for first release)

## Assumptions

- The PA host app loads the micro-frontend via module federation or a similar remote entry mechanism. The exact bootstrap is defined by the host app; this milestone provides the remote entry point.
- The backend runs on a known base URL configurable via environment variable.

## Task Order

1. `001-design-tokens-and-shell.md` — CSS custom properties, sidebar layout, routing shell. Everything else mounts inside this.
2. `002-api-client.md` — Typed API client for all M1/M2 endpoints. Both screens depend on this.
3. `003-weekly-planning-screen.md` — The main IC screen: RCDO browser, commitment list, add/edit/delete, reorder, lock.
4. `004-reconciliation-screen.md` — The reconciliation screen: stats bar, status annotations, submit.
5. `005-carry-forward-and-edge-cases.md` — Carry-forward UI, archived-outcome warnings, empty states, error handling.

## Milestone Success Criteria

- The micro-frontend mounts in a host-app-like container and renders the sidebar + content area
- IC can browse RCDO hierarchy, create commitments linked to Outcomes, reorder by priority, and lock the plan
- IC can transition to reconciliation, annotate all commitments, and submit
- Carry-forward items appear in the next week's plan with visual indication
- Archived Outcome warnings display on affected commitments
- All interactions match the visual design in `st6.pen`

## Milestone Validation

- `cd frontend && npm run build` compiles without errors
- `cd frontend && npm test` passes all component and integration tests
- Visual comparison against `st6.pen` screenshots for both screens
- End-to-end manual walkthrough: plan week → lock → reconcile → verify carry-forward in next week

## Risks / Follow-ups

- Module federation configuration depends on the PA host app's bundler setup. Task 001 defines a reasonable default but may need adjustment during integration.
- Drag-and-drop library choice affects bundle size. Keep dependencies minimal.
