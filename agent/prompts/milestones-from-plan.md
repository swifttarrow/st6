# Generate Milestones & Implementation Specs from Plan

Takes an implementation plan and generates a structured breakdown under `docs/plans/milestones/`. Each numbered document is an **implementation spec**: enough detail that an agent (or developer) can write code **without inventing** APIs, file layout, or behavior—the plan’s intent is translated into testable contracts.

---

## When to Use

- After a plan is approved and before implementation
- When you need trackable units of work with **clear acceptance criteria and interfaces**
- When handoffs must work across sessions, agents, or team members

---

## Input

You will receive:

1. **Plan path** — e.g. `docs/plans/2025-03-06-sessionlens.md`
2. Optional: stack constraints, test runner, auth patterns, or “spec verbosity” (minimal vs full contracts)

Read the plan completely before generating.

---

## Output Structure

```
docs/plans/milestones/
├── m1-milestone-slug/
│   ├── README.md              # Milestone overview, dependencies, rollup success criteria
│   ├── 001-spec-slug.md       # Implementation spec (agent-executable)
│   ├── 002-spec-slug.md
│   └── ...
├── m2-milestone-slug/
│   ├── README.md
│   ├── 001-spec-slug.md
│   └── ...
└── _index.md                  # Master index: milestones, order, links to plan
```

Use `NNN` = zero-padded spec number (001, 002, …) within each milestone. Slugs should name the **behavior or surface** (e.g. `livekit-token-route`, `frame-sampler-hook`), not vague actions (“implement stuff”).

---

## Process

### Step 1: Parse the Plan

1. Read the plan file fully
2. Identify phases/sections that map to milestones (e.g. "Phase 1: ...", "Phase 2: ...")
3. Extract for each phase:
   - Overview / goal
   - Concrete changes (modules, routes, data, config)
   - Success criteria (automated + manual verification)
   - Dependencies on prior phases and **contracts** those phases must expose

### Step 2: Create Milestone Directories

For each phase in the plan:

- Create `docs/plans/milestones/mN-slug/` where:
  - `mN` = phase number prefixed by `m`, no leading zero (m1, m2, …)
  - `slug` = kebab-case from phase title (e.g. `project-setup-webrtc`)

### Step 3: Write Milestone README

Each `docs/plans/milestones/mN-slug/README.md` must include:

```markdown
# Milestone N: [Phase Title]

## Overview
[From plan phase overview]

## Dependencies
- [ ] Milestone N-1 (if applicable)
- [ ] [Other prerequisites, including named exports/APIs from prior milestones]

## Changes Required
[Summarized from plan; link to plan section anchors]

## Success Criteria

### Automated Verification
- [ ] [From plan — commands, tests, linters]

### Manual Verification
- [ ] [From plan — user-visible checks]

## Implementation specs
- [001-spec-slug](./001-spec-slug.md)
- [002-spec-slug](./002-spec-slug.md)
```

### Step 4: Decompose into Implementation Specs

Break each phase into **spec documents**, not todo-shaped blurbs. Each spec should:

- Cover **one coherent slice** of behavior (often still 30–90 minutes of focused work, but bounded by **scope and contracts**, not time)
- State **what** the system must do and **where** it lives; avoid “implement X well” without criteria
- List **dependencies** on earlier specs (by path or milestone) so order is enforceable
- Be **falsifiable**: a reviewer can say “done / not done” from the Verification section alone

**Anti-patterns to avoid in spec bodies**

- Single-line deliverables like “Add API” or “Wire up component” with no request/response or props
- Duplicating the whole plan; **distill** only what this spec needs
- Mixing unrelated concerns in one file (split so each spec has one primary surface or module)

**Spec file format** — `docs/plans/milestones/mN-slug/NNN-spec-slug.md`:

```markdown
# Spec NNN: [Short Title]

## Summary
[One paragraph: behavior and why it exists; link to plan section]

## Scope

### In scope
- [Bullet list]

### Out of scope
- [Explicit non-goals to prevent gold-plating]

## Dependencies
- **Prior specs:** [e.g. `./001-foo.md` must be merged first — list functions/types/routes it must expose]
- **External:** [libraries, env vars, services — with names]

## Interfaces & contracts

### Public API (choose what applies)
- **HTTP:** method(s), path(s), auth, request/response JSON shapes (field names + types), status codes for success and expected errors
- **Functions/modules:** signatures (language-appropriate), input/output types, thrown/rejected errors
- **CLI / jobs:** argv, exit codes, idempotency expectations
- **UI:** routes or components affected; props/state; accessibility or loading constraints if plan requires

### Data & config
- Env vars (name, purpose, required vs optional)
- DB/schema migrations (tables, columns, indexes) if any
- Feature flags or config keys

## Behavior

### Acceptance criteria
Use **testable** statements (numbered). Prefer “Given / When / Then” or “Must …” bullets.

1. …
2. …

### Edge cases & errors
- [Empty input, timeouts, auth failure, concurrent calls, etc. — what should happen]

## File map
| Action | Path | Purpose |
|--------|------|---------|
| Create | `path/to/file` | … |
| Modify | `path/to/file` | … |

## Verification

### Automated
- [ ] Commands to run (e.g. `pnpm test`, specific test file patterns)
- [ ] What must pass / what new tests this spec requires

### Manual (if needed)
- [ ] Steps to confirm in browser or staging

## Notes
[Only if necessary: performance budgets, security notes, compatibility, copy-paste from plan that is essential context]
```

Adapt sections: omit tables that do not apply, but **never** omit Scope, Acceptance criteria, File map, and Verification for code-heavy specs.

### Step 5: Create Master Index

Create `docs/plans/milestones/_index.md`:

```markdown
# Milestones: [Plan Title]

**Source plan:** [path to plan]

## Milestone Order

| # | Milestone | Status |
|---|-----------|--------|
| 1 | [m1-slug](./m1-slug/) | Pending |
| 2 | [m2-slug](./m2-slug/) | Pending |
| ... | ... | ... |

## Quick Links
- [Plan](../YYYY-MM-DD-plan-name.md)
- [Research](../../research/...) (if referenced)
```

---

## Guidelines

- **One milestone per plan phase** — preserve the plan's phase structure
- **Specs are contracts** — if two implementations could both “look right” but behave differently, the spec is too vague; add criteria or types
- **Preserve success criteria** — rollup automated and manual verification in milestone READMEs; **mirror** the critical parts into each spec’s Verification
- **Link back to plan** — Summary and milestone README should reference plan sections (anchors)
- **Slug consistently** — `mN-` prefix + kebab-case; spec files: `NNN-descriptive-slug.md`
- **Respect order** — specs list prior dependencies explicitly; index lists milestones in dependency order
- **Agent-oriented** — write so an implementer can open **only** this spec + the repo and know what to create, what to call it, and how to prove correctness

---

## Example Mapping (SessionLens)

| Plan Phase | Milestone Dir | Example spec slugs (illustrative) |
|------------|---------------|-----------------------------------|
| Phase 1: Project Setup & WebRTC | `m1-project-setup-webrtc/` | `001-package-tooling`, `002-livekit-env-and-client`, `003-frame-sampler-interface`, `004-token-endpoint-post` |
| Phase 2: Face Detection & Gaze | `m2-face-detection-gaze/` | `001-mediapipe-init-wasm`, `002-gaze-from-landmarks`, `003-pipeline-orchestration` |
| Phase 3: Audio Pipeline | `m3-audio-pipeline/` | `001-vad-wrapper-silero`, `002-talk-time-aggregator`, `003-audio-pipeline-wiring` |

Each row’s third column should expand into full spec files with HTTP/types/file maps as appropriate—not one-line titles only.

---

## Invocation

Attach this prompt and the plan, then:

> Generate milestones and implementation specs from @docs/plans/[plan-file].md

Or:

> Create milestone breakdown with agent-ready specs for the SessionLens plan
