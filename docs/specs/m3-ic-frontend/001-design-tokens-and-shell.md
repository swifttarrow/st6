# Task 001: Design Tokens and Application Shell

## Purpose

Establish the CSS design tokens, shared layout components (sidebar, page header), and routing shell for the micro-frontend. This provides the visual foundation and navigation structure that all screens mount inside.

## Inputs

- Spec: `docs/specs/m3-ic-frontend/README.md` (Design System section)
- Files: `frontend/src/index.ts`, `frontend/src/types/host-context.ts` (from M1 Task 001)
- Design: `st6.pen` frames `K3Xao` and `69svb` — sidebar and layout structure

## Outputs

- Create: `frontend/src/styles/tokens.css` — CSS custom properties for all design tokens
- Create: `frontend/src/styles/reset.css` — minimal CSS reset/normalize
- Create: `frontend/src/styles/typography.css` — font-face declarations and text utility classes
- Create: `frontend/src/components/Shell/Shell.tsx` — top-level layout: sidebar + main content area
- Create: `frontend/src/components/Shell/Shell.module.css`
- Create: `frontend/src/components/Sidebar/Sidebar.tsx` — navigation sidebar
- Create: `frontend/src/components/Sidebar/Sidebar.module.css`
- Create: `frontend/src/components/PageHeader/PageHeader.tsx` — page title + badge + action buttons
- Create: `frontend/src/components/PageHeader/PageHeader.module.css`
- Create: `frontend/src/components/Badge/Badge.tsx` — status badge component (DRAFT, LOCKED, RECONCILING, RECONCILED)
- Create: `frontend/src/components/Badge/Badge.module.css`
- Create: `frontend/src/router.tsx` — route definitions for /my-week, /reconciliation, /history (placeholder), /team (placeholder), /leadership (placeholder)
- Modify: `frontend/src/index.ts` — mount function renders the Shell with router
- Create: `frontend/src/context/UserContext.tsx` — React context provider wrapping HostContext
- Side effects: none

## Dependencies

- Prior task: none (within M3), but requires M1 Task 001 completed (frontend scaffold)
- Required artifacts: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/src/types/host-context.ts`

## Constraints

- All color, spacing, and typography values must come from CSS custom properties defined in `tokens.css` — no hardcoded values in component styles.
- Sidebar is 240px fixed width. Main content fills remaining space.
- TypeScript strict mode. All components must have typed props.
- The sidebar must show the correct nav items per role:
  - IC: My Week, Reconciliation, History
  - Manager/Leadership: My Week, Reconciliation, History, Team Dashboard, Leadership View
- Active nav item: primary red dot + red text (weight 500). Inactive: grey dot + grey text.
- The manager/leadership nav items render but link to placeholder routes in this milestone.

## Required Changes

### 1. Design Tokens (`tokens.css`)

```css
:root {
  /* Colors */
  --color-primary: #E42313;
  --color-text-primary: #0D0D0D;
  --color-text-secondary: #7A7A7A;
  --color-border: #E8E8E8;
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-success: #22C55E;
  --color-alert-bg: #FEF2F2;
  --color-disabled: #B0B0B0;

  /* Typography — families */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Typography — sizes */
  --text-title: 40px;
  --text-section: 18px;
  --text-nav: 14px;
  --text-body: 13px;
  --text-caption: 12px;

  /* Typography — weights */
  --weight-semibold: 600;
  --weight-medium: 500;
  --weight-normal: 400;

  /* Layout */
  --sidebar-width: 240px;
  --content-padding-y: 40px;
  --content-padding-x: 48px;
  --section-gap: 32px;

  /* Components */
  --card-padding: 28px;
  --row-padding-y: 16px;
  --row-padding-x: 20px;
  --badge-padding-y: 4px;
  --badge-padding-x: 10px;
}
```

### 2. Shell Component

`Shell.tsx`:
- Renders sidebar on the left (fixed 240px) and a content area on the right (flex: 1)
- Content area has padding per tokens
- Accepts children (routed pages)
- Full viewport height

### 3. Sidebar Component

`Sidebar.tsx`:
- Props: `currentPath: string`, `userRole: 'IC' | 'MANAGER' | 'LEADERSHIP'`
- Logo section: red square mark + "WCT" text (Space Grotesk 18px semibold)
- Nav section: vertical list of nav items with active/inactive styling
- Nav items for IC role: My Week (`/my-week`), Reconciliation (`/reconciliation`), History (`/history`). ICs do NOT see Team Dashboard or Leadership View nav items.
- Nav items for Manager role: all IC items PLUS Team Dashboard (`/team`). No Leadership View.
- Nav items for Leadership role: all IC items PLUS Team Dashboard (`/team`) AND Leadership View (`/leadership`).
- Team Dashboard and Leadership View routes render placeholder "Coming soon" pages in this milestone (M4 implements them).
- Manager/Leadership sidebar uses Lucide icons (calendar, users, trending-up, history) per frame `2PL2M` design. IC sidebar uses colored dots per frame `K3Xao` design.
- User info section at bottom: avatar circle + name + role (from UserContext)
- Spacer between nav and user info pushes user info to bottom

### 4. PageHeader Component

`PageHeader.tsx`:
- Props: `title: string`, `badge?: { label: string, variant: 'default' | 'active' | 'success' | 'alert' }`, `actions?: ReactNode`
- Title: Space Grotesk 40px weight 500, letter-spacing -1px
- Badge: inline next to title, styled per variant
- Actions: rendered to the right (flex justify-between)

### 5. Badge Component

`Badge.tsx`:
- Props: `label: string`, `variant: 'default' | 'active' | 'success' | 'alert'`
- default: grey border, dark text (#FAFAFA bg, #E8E8E8 border)
- active: red text on light bg
- success: green text/border
- alert: red text/border
- Padding: 4px 10px, 1px border, Inter 12px weight 500

### 6. Router

Define routes:
- `/my-week` → WeeklyPlanningPage (placeholder div for now, implemented in Task 003)
- `/reconciliation` → ReconciliationPage (placeholder div, Task 004)
- `/history` → placeholder "Coming soon"
- `/team` → placeholder "Coming soon" (M4)
- `/leadership` → placeholder "Coming soon" (M4)
- Default redirect: `/my-week`

### 7. UserContext Provider

`UserContext.tsx`:
- Create a React context from `HostContext`
- The `mount` function in `index.ts` wraps the app in this provider
- Export `useUserContext()` hook

### 8. Mount Function Update

Update `frontend/src/index.ts`:
- `mount(container, context)` renders `<UserContextProvider value={context}><Shell><Router /></Shell></UserContextProvider>` into the container

## Acceptance Criteria

- [ ] `npm run build` compiles without errors
- [ ] The mount function renders a sidebar + content area layout
- [ ] Sidebar shows correct nav items based on user role
- [ ] Active nav item is highlighted in primary red
- [ ] Navigating between routes shows the correct placeholder content
- [ ] All colors, fonts, and spacing match the design tokens (no hardcoded values)
- [ ] `useUserContext()` returns the host context with userId, role, teamId

## Validation

- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd frontend && npm test` — component tests for Sidebar, Shell, Badge pass
- [ ] Visual inspection: sidebar matches `st6.pen` layout (240px width, logo, nav items, user info at bottom)

## Stop and Ask

- If the PA host app uses a specific router (e.g., it manages top-level routes and passes a base path), stop and ask before implementing the router, as the micro-frontend may need to use a memory router or basename.
