# Implement Plan

Implement an approved technical plan from `docs/plans/`. Execute phase-by-phase with verification.

## Getting Started

When given a plan path:
- Read the plan completely; note existing checkmarks
- Read the original ticket and all files mentioned
- Create a todo list to track progress
- Start implementing when you understand the work

If no plan path provided, ask for one.

## Implementation Philosophy

- Follow the plan's intent while adapting to reality
- Implement each phase fully before moving to the next
- Update checkboxes in the plan as you complete sections
- When things don't match, STOP and explain clearly

## On Mismatch

```
Issue in Phase [N]:
Expected: [what the plan says]
Found: [actual situation]
Why this matters: [explanation]

How should I proceed?
```

When the developer responds with a product or technical decision, record it (see **Recording Decisions** below).

## Recording Decisions

Whenever you ask for clarification from the developer and receive an answer that involves **product or technical considerations**, append it to the dev log:

1. **Path**: `developer-log.md`
2. **If the file does not exist**: Create it with a heading and the decision entry
3. **Format** for each entry:
   - Date (YYYY-MM-DD)
   - Context (what was unclear or in question)
   - Options considered (if applicable)
   - Decision (what the developer decided)
   - Rationale (why this option was chosen)
   - Phase or area affected (if applicable)
   - Owner (Developer / Agent + developer confirmation)

Example entry:

```markdown
## [YYYY-MM-DD] [Brief title]

**Context:** [What prompted the question]
**Options considered:** [Option A vs Option B]
**Decision:** [Developer's answer]
**Rationale:** [Why this was selected]
**Scope:** [Phase N / component / etc.]
**Owner:** [Developer / Agent + developer confirmation]
```

Only record major product- or technical-related decisions. Skip administrative or procedural answers (e.g., "yes, continue", "run the tests").

If the agent makes a non-trivial technical choice due to ambiguity, log it and request developer confirmation at the next checkpoint.

## Verification

After each phase:
1. Run automated success criteria
2. Fix issues before proceeding
3. Update plan checkboxes
4. **Pause for human verification**:

```
Phase [N] Complete – Ready for Manual Verification

Automated verification passed:
- [List checks that passed]

Please perform manual verification from the plan:
- [List manual steps]

Let me know when complete so I can proceed to Phase [N+1].
```

If instructed to run multiple phases consecutively, skip the pause until the last phase.

Do not check off manual verification items until confirmed by the user.

## Resuming

If the plan has checkmarks, trust completed work and pick up from the first unchecked item.
