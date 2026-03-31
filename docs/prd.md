# Weekly Commitment Tracker

## One-Line Summary

A weekly planning module that structurally links every individual contributor's weekly commitments to the organization's strategic hierarchy (Rally Cries, Defining Objectives, Outcomes), replacing the current disconnected 15-Five workflow with a full commit-to-reconciliation lifecycle visible to ICs, managers, and leadership.

## Problem Statement

- The organization uses 15-Five for weekly planning, but individual weekly commitments have no structural connection to organizational strategic goals (Rally Cries → Defining Objectives → Outcomes).
- Managers cannot see how their team's weekly work maps to the strategic hierarchy until misalignment has already caused downstream impact.
- There is no mechanism to compare what was planned against what was actually accomplished, so retrospective learning and accountability are informal at best.
- Leadership has no cross-team view of how weekly execution connects to strategic priorities.

## Users

### Individual Contributors (Primary)

- Enter weekly commitments, link each to an Outcome in the strategic hierarchy, prioritize, lock their plan, and reconcile at week's end.
- Initiate all lifecycle transitions for their own weekly plan.

### Managers (Primary)

- Review their direct reports' weekly commitments in aggregate.
- Identify misalignment between team activity and strategic goals before it compounds.
- Review reconciliation results to understand planned-vs-actual gaps across the team.

### Organizational Leadership (Secondary)

- View cross-team roll-ups to assess whether weekly execution across the organization is tracking toward Rally Cries and Defining Objectives.
- Spot systemic patterns (e.g., an entire Rally Cry with no weekly commitments mapped to it).

## Jobs To Be Done

- **IC**: "I want to plan my week in a way that makes it obvious how my work connects to what the organization cares about, and I want to reflect honestly on what I actually accomplished."
- **Manager**: "I want to see at a glance whether my team's weekly plans align with our strategic goals, and I want to catch misalignment early enough to course-correct."
- **Leadership**: "I want to know whether the organization's weekly effort is actually pointed at our Rally Cries, without having to ask each manager."

## Goals

- Every weekly commitment is explicitly linked to an Outcome in the RCDO hierarchy — no orphaned work items.
- ICs move through a complete weekly lifecycle: plan, prioritize, lock, execute, reconcile, carry forward.
- Managers and leadership have real-time visibility into alignment between weekly work and strategic goals.
- Planned-vs-actual comparison is captured every week, building an organizational record of execution fidelity.

## Non-Goals

- This initiative does not replace other 15-Five features (pulse surveys, 1:1 agendas, peer recognition, feedback).
- This system is not a project management or task-tracking tool — it captures weekly commitments at the level of meaningful deliverables, not subtasks.
- Real-time collaboration or co-editing of weekly plans is not in scope.
- Automated suggestions for what to commit to (e.g., AI-driven goal recommendations) are out of scope.

## User Scenarios

### Scenario 1: IC Plans Their Week

Alex opens the module on Monday. Last week's three incomplete commitments are pre-loaded as carry-forward candidates. Alex keeps two, removes one that is no longer relevant, and adds three new commitments. For each, Alex links it to an Outcome under the appropriate Rally Cry and Defining Objective. Alex uses the strategy layer to rank all five by priority. Satisfied, Alex locks the weekly plan.

### Scenario 2: Manager Reviews Team Alignment

Jordan opens the manager dashboard mid-week. The roll-up shows that 80% of the team's commitments map to Rally Cry #1 but nothing maps to Rally Cry #2, which is a board-level priority this quarter. Jordan reaches out to two team members to discuss rebalancing before the week is lost.

### Scenario 3: IC Reconciles at End of Week

On Friday, Alex opens the reconciliation view. Each commitment shows its planned status alongside a prompt to mark actual status (completed, partially completed, not started, dropped). Alex marks three as completed and two as partially completed, adds brief notes, and submits. The plan moves to RECONCILED. The two partial items default into next week's carry-forward list.

### Scenario 4: Leadership Spots a Gap

Pat, a VP, opens the leadership view. A cross-team roll-up shows that Rally Cry #3 ("Expand into APAC") has zero commitments mapped to it across all teams for the third consecutive week. Pat flags this to the relevant directors.

## Functional Requirements

### Strategic Hierarchy Management (RCDO)

- The system must support full CRUD for a three-level hierarchy: Rally Cry → Defining Objective → Outcome.
- RCDO hierarchy management is restricted to users with Manager or Leadership roles.
- Each level must have at minimum a name and description.
- Deleting or archiving a hierarchy node must not silently orphan existing commitments — the system must surface affected commitments and require resolution.
- The hierarchy must be browsable and searchable when linking commitments.

### Weekly Commitment Management

- ICs can create, read, update, and delete weekly commitments while the week is in DRAFT state.
- Each commitment must be linked to exactly one Outcome in the RCDO hierarchy.
- Commitments must capture at minimum: a description, the linked Outcome, and a priority ranking.
- ICs can add optional notes or context to any commitment.

### Strategy Layer (Prioritization)

- ICs must be able to categorize and prioritize their weekly commitments before locking.
- The prioritization mechanism should make relative importance visually clear (e.g., ordered ranking, matrix, or similar).
- Priority order must be preserved through the lifecycle and visible during reconciliation and manager review.

### Weekly Lifecycle State Machine

- Each IC's weekly plan progresses through states: **DRAFT → LOCKED → RECONCILING → RECONCILED**.
- **DRAFT**: IC can add, edit, remove, and reorder commitments. This is the only state where commitment content can be modified.
- **LOCKED**: The plan is frozen. No content changes allowed. This represents the IC's declared plan for the week.
- **RECONCILING**: The IC is comparing planned commitments against actual results. Each commitment receives an actual-status annotation.
- **RECONCILED**: Reconciliation is complete and submitted. The week's record is finalized.
- Forward state transitions (DRAFT → LOCKED → RECONCILING → RECONCILED) are IC-initiated.
- **Manager Unlock**: A manager may transition an IC's plan from LOCKED back to DRAFT, enabling the IC to revise commitments. This is the only backward transition allowed and is restricted to the Manager role.
- The system must prevent all other invalid transitions (e.g., RECONCILED → RECONCILING, RECONCILING → DRAFT).
- The system must record timestamps for each state transition.

### Carry Forward

- When a new week begins, all incomplete commitments (partially completed or not started) from the prior RECONCILED week are pre-populated as carry-forward candidates in the new DRAFT.
- The IC can accept, modify, or remove any carry-forward item before locking.
- Items the IC removes from carry-forward are not deleted from the prior week's record — they remain in the historical reconciliation.

### Reconciliation View

- During RECONCILING state, the IC sees each commitment side-by-side with fields to record actual outcome.
- Actual-status options at minimum: Completed, Partially Completed, Not Started, Dropped.
- ICs can add a brief note to each commitment explaining variance.
- The view must clearly surface the delta between planned priority/count and actual results.

### Manager Dashboard

- Managers see a roll-up of their direct reports' weekly plans.
- The dashboard must show, per team member: current lifecycle state, number of commitments, and alignment to RCDO hierarchy nodes.
- Managers can drill into any team member's weekly plan (read-only).
- The dashboard must surface aggregate alignment data: which Rally Cries and Defining Objectives have the most/least commitment coverage across the team.

### Leadership View

- Leadership can view cross-team roll-ups of commitment coverage against the RCDO hierarchy.
- The view must highlight strategic nodes (Rally Cries, Defining Objectives) with low or zero commitment coverage.
- Leadership views are read-only.

### Historical Record

- All reconciled weeks must be retained and queryable.
- Users, managers, and leadership can view past weeks' plans and reconciliation results.
- Historical data must support trend analysis (e.g., weekly completion rates over time, carry-forward frequency).

## System Behavior and Edge Cases

- **No commitments linked to an Outcome that gets deleted**: The system must prevent deletion of Outcomes with active (non-reconciled) commitments. Archived Outcomes should remain visible in historical records.
- **IC does not lock by end of week**: The plan remains in DRAFT. Managers should be able to see that the IC has not locked. The system should not auto-transition states.
- **IC does not reconcile**: The previous week stays in LOCKED state. Carry-forward cannot populate until reconciliation completes. The system should surface this to the IC and their manager.
- **Empty week**: An IC may lock a week with zero commitments. This is valid and should be visible to the manager (may indicate a problem).
- **Concurrent hierarchy edits**: If an RCDO node is renamed while commitments reference it, the commitment should reflect the updated name. Structural changes (moves, deletes) must not silently break linkage.
- **Carry-forward with changed hierarchy**: If an Outcome is archived between weeks, carried-forward items referencing it must be flagged for the IC to re-link before locking.
- **Partial reconciliation**: If an IC submits reconciliation with some items un-annotated, the system must block transition to RECONCILED — all items require an actual-status.

## Constraints

- **Integration**: The module must integrate as a micro-frontend into the existing PA host application, following the established remote module pattern.
- **User Identity and Roles**: The micro-frontend must ingest user identity, role (IC, Manager, Leadership), and reporting relationships from the PA host application. The module does not manage its own user directory.
- **Language**: The implementation is constrained to TypeScript (strict mode), Java 21, and SQL.
- **Week Boundaries**: Weeks run Monday through Friday.
- **Scope**: This module replaces only the weekly planning/commitment functionality of 15-Five. No other 15-Five features are in scope.
- **Data Isolation**: Weekly commitment data and RCDO hierarchy data must be managed by this module — not shared or co-owned with other modules at the data layer.

## Success Metrics

- **Adoption**: Percentage of ICs completing the full weekly lifecycle (DRAFT → RECONCILED) each week, targeting >90% within 8 weeks of launch.
- **Alignment Coverage**: Percentage of active Rally Cries and Defining Objectives that have at least one commitment mapped to them per week.
- **Carry-Forward Rate**: Average percentage of commitments carried forward per IC per week — a proxy for planning accuracy. Expectation: decreasing trend over time.
- **Reconciliation Completion Rate**: Percentage of locked weeks that reach RECONCILED state within the same week.
- **Manager Engagement**: Frequency of manager dashboard views per week — indicates whether the visibility tooling is being used.
- **Time to Detect Misalignment**: Qualitative measure — managers and leadership should report catching alignment gaps earlier than with 15-Five (captured via periodic survey).

## Risks and Unknowns

- **Week Boundary Definition**: Weeks run Monday–Friday. This is fixed for first release but may need to become configurable later.
- **Scale of Hierarchy**: How many Rally Cries, Defining Objectives, and Outcomes exist at any given time? If the hierarchy is very large, the linking experience needs to support efficient search and filtering.
- **Reporting Depth**: Leadership wants cross-team views — does this include all teams, or a filtered subset? How deep in the org tree should roll-ups go?
- **15-Five Migration**: Is there historical data in 15-Five that needs to be migrated or referenced, or is this a clean start?
- **Notification Needs**: Should the system notify ICs who haven't locked or reconciled? Should managers be notified of alignment gaps? Notification channels and triggers are undefined.
- **Org Structure Integration Details**: Manager-to-IC relationships and user roles are provided by the PA host application. The specific contract for how the micro-frontend ingests this data (e.g., shared context, injection at mount time) needs to be defined during implementation.

## Initial Scope

### First Release

- RCDO hierarchy CRUD restricted to Manager and Leadership roles (single-tenant, one hierarchy for the org).
- Weekly commitment CRUD with mandatory Outcome linking.
- Strategy layer for prioritization (ordered ranking at minimum).
- Full lifecycle state machine (DRAFT → LOCKED → RECONCILING → RECONCILED) with IC-initiated forward transitions.
- Manager unlock: managers can transition an IC's plan from LOCKED back to DRAFT.
- Carry-forward from prior week with opt-out.
- Reconciliation view with planned-vs-actual comparison.
- Manager dashboard with team roll-up and drill-down.
- Leadership cross-team roll-up view (read-only).
- User role and reporting-relationship ingestion from PA host app.
- Micro-frontend integration into PA host app.

### Deferred

- Historical trend analytics and charting.
- Notifications and reminders.
- 15-Five data migration.
- Configurable week boundaries.
- Bulk operations (e.g., manager locking on behalf of an IC).
