-- Idempotent demo seed for WCT (PostgreSQL).
-- Clears application tables only; leaves flyway_schema_history untouched.
-- Safe to run multiple times.
--
-- Users (string ids): alice, bob, carol, diana, frank (team-alpha); eve (team-beta).
-- Duplicate tiers *-b and *-c triple weekly_plan + commitment rows; expanded RCDO (6×6×12).
-- Weeks include 2026-02-23 .. 2026-04-06 (Mondays) so WeekNavigator shows history + “current” (≈2026-04-01).

BEGIN;

UPDATE commitment SET carried_forward_from_id = NULL WHERE carried_forward_from_id IS NOT NULL;

DELETE FROM plan_state_transition;
DELETE FROM commitment;
DELETE FROM weekly_plan;
DELETE FROM outcome;
DELETE FROM defining_objective;
DELETE FROM rally_cry;

-- ── RCDO: six rally cries, six defining objectives, twelve outcomes ─────────

INSERT INTO rally_cry (id, name, description, sort_order)
VALUES
    (
        '11111111-1111-4111-8111-111111111101'::uuid,
        'Customer obsession',
        'Deepen relationships and retention',
        0
    ),
    (
        '11111111-1111-4111-8111-111111111102'::uuid,
        'Product velocity',
        'Ship reliable value every week',
        1
    ),
    (
        '11111111-1111-4111-8111-111111111103'::uuid,
        'Operational excellence',
        'Predictable delivery and quality bars',
        2
    ),
    (
        '11111111-1111-4111-8111-111111111104'::uuid,
        'Talent density',
        'Hire, grow, and retain top performers',
        3
    ),
    (
        '11111111-1111-4111-8111-111111111105'::uuid,
        'Security posture',
        'Trust, compliance, and safe defaults',
        4
    ),
    (
        '11111111-1111-4111-8111-111111111106'::uuid,
        'International growth',
        'Expand reach in priority regions',
        5
    );

INSERT INTO defining_objective (id, rally_cry_id, name, description, sort_order)
VALUES
    (
        '22222222-2222-4222-8222-222222222201'::uuid,
        '11111111-1111-4111-8111-111111111101'::uuid,
        'Enterprise expansion',
        'Grow ARR in named accounts',
        0
    ),
    (
        '22222222-2222-4222-8222-222222222202'::uuid,
        '11111111-1111-4111-8111-111111111102'::uuid,
        'Platform reliability',
        'Reduce incidents and toil',
        0
    ),
    (
        '22222222-2222-4222-8222-222222222203'::uuid,
        '11111111-1111-4111-8111-111111111103'::uuid,
        'Delivery predictability',
        'Sprint commitments and dependency hygiene',
        0
    ),
    (
        '22222222-2222-4222-8222-222222222204'::uuid,
        '11111111-1111-4111-8111-111111111104'::uuid,
        'Career frameworks',
        'Leveling and growth paths',
        0
    ),
    (
        '22222222-2222-4222-8222-222222222205'::uuid,
        '11111111-1111-4111-8111-111111111105'::uuid,
        'Zero-trust rollout',
        'Identity, secrets, and audit coverage',
        0
    ),
    (
        '22222222-2222-4222-8222-222222222206'::uuid,
        '11111111-1111-4111-8111-111111111106'::uuid,
        'Localization readiness',
        'i18n, payments, and regional compliance',
        0
    );

INSERT INTO outcome (id, defining_objective_id, name, description, sort_order)
VALUES
    (
        '33333333-3333-4333-8333-333333333301'::uuid,
        '22222222-2222-4222-8222-222222222201'::uuid,
        'Q2 pipeline health',
        'Maintain qualified pipeline coverage',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333302'::uuid,
        '22222222-2222-4222-8222-222222222201'::uuid,
        'Partner-led deals',
        'Source 20% ACV via partners',
        1
    ),
    (
        '33333333-3333-4333-8333-333333333303'::uuid,
        '22222222-2222-4222-8222-222222222202'::uuid,
        'SLO adherence',
        'Keep core APIs within error budget',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333304'::uuid,
        '22222222-2222-4222-8222-222222222202'::uuid,
        'Developer experience',
        'Cut median build / deploy time',
        1
    ),
    (
        '33333333-3333-4333-8333-333333333305'::uuid,
        '22222222-2222-4222-8222-222222222203'::uuid,
        'Dependency mapping',
        'Visible critical path across teams',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333306'::uuid,
        '22222222-2222-4222-8222-222222222203'::uuid,
        'Release train health',
        'On-time milestones with quality gates',
        1
    ),
    (
        '33333333-3333-4333-8333-333333333307'::uuid,
        '22222222-2222-4222-8222-222222222204'::uuid,
        'Manager enablement',
        'Playbooks for feedback and planning',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333308'::uuid,
        '22222222-2222-4222-8222-222222222204'::uuid,
        'Internal mobility',
        'Role changes without losing momentum',
        1
    ),
    (
        '33333333-3333-4333-8333-333333333309'::uuid,
        '22222222-2222-4222-8222-222222222205'::uuid,
        'Secrets rotation',
        'Automated cadence with break-glass',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333310'::uuid,
        '22222222-2222-4222-8222-222222222205'::uuid,
        'SOC2 evidence pipeline',
        'Continuous control monitoring',
        1
    ),
    (
        '33333333-3333-4333-8333-333333333311'::uuid,
        '22222222-2222-4222-8222-222222222206'::uuid,
        'EU data residency',
        'Region pinning for PII workloads',
        0
    ),
    (
        '33333333-3333-4333-8333-333333333312'::uuid,
        '22222222-2222-4222-8222-222222222206'::uuid,
        'APAC GTM launch kit',
        'Pricing, support, and messaging',
        1
    );

-- ── Weekly plans (user_id, team_id, week_start_date Monday, status) ─────────
-- UUIDs: aaaaaaaa-aaaa-4aaa-8aaa-0000000001xx

INSERT INTO weekly_plan (id, user_id, team_id, week_start_date, status)
VALUES
    -- alice: history + current draft
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000101'::uuid, 'alice', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000102'::uuid, 'alice', 'team-alpha', DATE '2026-03-02', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000103'::uuid, 'alice', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000104'::uuid, 'alice', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000105'::uuid, 'alice', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000106'::uuid, 'alice', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000107'::uuid, 'alice', 'team-alpha', DATE '2026-04-06', 'DRAFT'),
    -- bob: history + locked current week
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000108'::uuid, 'bob', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000109'::uuid, 'bob', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000110'::uuid, 'bob', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000111'::uuid, 'bob', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000112'::uuid, 'bob', 'team-alpha', DATE '2026-03-30', 'LOCKED'),
    -- carol: prior week done; current in reconciliation
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000113'::uuid, 'carol', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, 'carol', 'team-alpha', DATE '2026-03-30', 'RECONCILING'),
    -- diana: strong history + clean current
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000115'::uuid, 'diana', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000116'::uuid, 'diana', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000117'::uuid, 'diana', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000118'::uuid, 'diana', 'team-alpha', DATE '2026-03-30', 'RECONCILED'),
    -- frank: light history, draft current
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000119'::uuid, 'frank', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000120'::uuid, 'frank', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    -- eve: other team, same week axis
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000121'::uuid, 'eve', 'team-beta', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000122'::uuid, 'eve', 'team-beta', DATE '2026-03-30', 'LOCKED');

-- Duplicate weekly plans: same weeks as base tier; user_id suffix '-b'; plan ids +22
INSERT INTO weekly_plan (id, user_id, team_id, week_start_date, status)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000123'::uuid, 'alice-b', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000124'::uuid, 'alice-b', 'team-alpha', DATE '2026-03-02', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000125'::uuid, 'alice-b', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000126'::uuid, 'alice-b', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000127'::uuid, 'alice-b', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000128'::uuid, 'alice-b', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000129'::uuid, 'alice-b', 'team-alpha', DATE '2026-04-06', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000130'::uuid, 'bob-b', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000131'::uuid, 'bob-b', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000132'::uuid, 'bob-b', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000133'::uuid, 'bob-b', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000134'::uuid, 'bob-b', 'team-alpha', DATE '2026-03-30', 'LOCKED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000135'::uuid, 'carol-b', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, 'carol-b', 'team-alpha', DATE '2026-03-30', 'RECONCILING'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000137'::uuid, 'diana-b', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000138'::uuid, 'diana-b', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000139'::uuid, 'diana-b', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000140'::uuid, 'diana-b', 'team-alpha', DATE '2026-03-30', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000141'::uuid, 'frank-b', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000142'::uuid, 'frank-b', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000143'::uuid, 'eve-b', 'team-beta', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000144'::uuid, 'eve-b', 'team-beta', DATE '2026-03-30', 'LOCKED');

-- Duplicate weekly plans: same weeks as base tier; user_id suffix '-c'; plan ids +44
INSERT INTO weekly_plan (id, user_id, team_id, week_start_date, status)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000145'::uuid, 'alice-c', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000146'::uuid, 'alice-c', 'team-alpha', DATE '2026-03-02', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000147'::uuid, 'alice-c', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000148'::uuid, 'alice-c', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000149'::uuid, 'alice-c', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000150'::uuid, 'alice-c', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000151'::uuid, 'alice-c', 'team-alpha', DATE '2026-04-06', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000152'::uuid, 'bob-c', 'team-alpha', DATE '2026-02-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000153'::uuid, 'bob-c', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000154'::uuid, 'bob-c', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000155'::uuid, 'bob-c', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000156'::uuid, 'bob-c', 'team-alpha', DATE '2026-03-30', 'LOCKED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000157'::uuid, 'carol-c', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, 'carol-c', 'team-alpha', DATE '2026-03-30', 'RECONCILING'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000159'::uuid, 'diana-c', 'team-alpha', DATE '2026-03-09', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000160'::uuid, 'diana-c', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000161'::uuid, 'diana-c', 'team-alpha', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000162'::uuid, 'diana-c', 'team-alpha', DATE '2026-03-30', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000163'::uuid, 'frank-c', 'team-alpha', DATE '2026-03-16', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000164'::uuid, 'frank-c', 'team-alpha', DATE '2026-03-30', 'DRAFT'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000165'::uuid, 'eve-c', 'team-beta', DATE '2026-03-23', 'RECONCILED'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000166'::uuid, 'eve-c', 'team-beta', DATE '2026-03-30', 'LOCKED');

-- ── Commitments (bbbbbbbb-bbbb-4bbb-8bbb-000000000xxx) ─────────────────────

INSERT INTO commitment (
    id,
    weekly_plan_id,
    outcome_id,
    description,
    priority,
    notes,
    actual_status,
    reconciliation_notes,
    carried_forward_from_id
)
VALUES
    -- alice 2026-02-23 RECONCILED
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000101'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Discovery calls with 3 prospects', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000101'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner webinar follow-ups', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    -- alice 2026-03-02
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000003'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000102'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Renewal risk review — Northwind', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000004'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000102'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Post-incident action items', 2, NULL, 'COMPLETED', NULL, NULL),
    -- alice 2026-03-09
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000005'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000103'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'EBR prep for ACME', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000006'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000103'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'CI cache experiment', 2, NULL, 'DROPPED', 'Pivoted to hotfix week', NULL),
    -- alice 2026-03-16
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000007'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000104'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Co-marketing asset draft', 1, NULL, 'NOT_STARTED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000008'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000104'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Error budget report', 2, NULL, 'COMPLETED', NULL, NULL),
    -- alice 2026-03-23
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000009'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000105'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Pipeline scrub with sales', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000010'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000105'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner portal feedback synthesis', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    -- alice 2026-03-30 DRAFT (current)
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000011'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000106'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Schedule executive business review with ACME', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000012'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000106'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Document on-call handoff improvements', 2, NULL, NULL, NULL, NULL),
    -- alice 2026-04-06 DRAFT
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000013'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000107'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Spike: deploy pipeline parallelism', 1, 'Next week focus', NULL, NULL, NULL),
    -- bob 2026-02-23
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000014'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000108'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner QBR slides', 1, NULL, 'COMPLETED', NULL, NULL),
    -- bob 2026-03-09
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000015'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000109'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Territory planning workshop', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000016'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000109'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Latency regression triage', 2, NULL, 'COMPLETED', NULL, NULL),
    -- bob 2026-03-16
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000017'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000110'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Mid-market outreach blitz', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    -- bob 2026-03-23
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000018'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000111'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Alliance newsletter draft', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000019'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000111'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Gradle cache rollout', 2, NULL, 'COMPLETED', NULL, NULL),
    -- bob 2026-03-30 LOCKED
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000020'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000112'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Draft partner one-pager', 1, 'Due Friday', NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000021'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000112'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Runbook updates for failover drill', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000022'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000112'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Forecast sync with leadership', 3, NULL, NULL, NULL, NULL),
    -- carol 2026-03-23 RECONCILED
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000023'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000113'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Customer health scoring v2', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000024'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000113'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'IDE sync performance fix', 2, NULL, 'DROPPED', 'Blocked by upstream', NULL),
    -- carol 2026-03-30 RECONCILING (one annotated, one not)
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000025'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Expand pilot to EU region', 1, NULL, 'COMPLETED', 'Met Wed', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000026'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Legal review for partner terms', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000027'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Chaos test in staging', 3, NULL, NULL, NULL, NULL),
    -- diana 2026-03-09
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000028'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000115'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Top account outreach', 1, NULL, 'COMPLETED', NULL, NULL),
    -- diana 2026-03-16
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000029'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000116'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner certification prep', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000030'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000116'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'SLO dashboard tiles', 2, NULL, 'COMPLETED', NULL, NULL),
    -- diana 2026-03-23
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000031'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000117'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'QBR deck for Globex', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000032'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000117'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Local dev env script cleanup', 2, NULL, 'COMPLETED', NULL, NULL),
    -- diana 2026-03-30 RECONCILED
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000033'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000118'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Executive readout — expansion targets', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000034'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000118'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Canary analysis for release 2.4', 2, NULL, 'COMPLETED', NULL, NULL),
    -- frank 2026-03-16
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000035'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000119'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Dependency upgrade batch', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    -- frank 2026-03-30 DRAFT
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000036'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000120'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'New partner onboarding checklist', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000037'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000120'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Synthetic monitor gaps', 2, NULL, NULL, NULL, NULL),
    -- eve team-beta
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000038'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000121'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'SMB renewal campaign', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000039'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000122'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Regional failover tabletop', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000040'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000122'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Developer survey analysis', 2, NULL, NULL, NULL, NULL);

INSERT INTO commitment (
    id,
    weekly_plan_id,
    outcome_id,
    description,
    priority,
    notes,
    actual_status,
    reconciliation_notes,
    carried_forward_from_id
) VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000041'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000123'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Discovery calls with 3 prospects', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000042'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000123'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner webinar follow-ups', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000043'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000124'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Renewal risk review — Northwind', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000044'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000124'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Post-incident action items', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000045'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000125'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'EBR prep for ACME', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000046'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000125'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'CI cache experiment', 2, NULL, 'DROPPED', 'Pivoted to hotfix week', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000047'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000126'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Co-marketing asset draft', 1, NULL, 'NOT_STARTED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000048'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000126'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Error budget report', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000049'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000127'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Pipeline scrub with sales', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000050'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000127'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner portal feedback synthesis', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000051'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000128'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Schedule executive business review with ACME', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000052'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000128'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Document on-call handoff improvements', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000053'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000129'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Spike: deploy pipeline parallelism', 1, 'Next week focus', NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000054'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000130'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner QBR slides', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000055'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000131'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Territory planning workshop', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000056'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000131'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Latency regression triage', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000057'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000132'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Mid-market outreach blitz', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000058'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000133'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Alliance newsletter draft', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000059'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000133'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Gradle cache rollout', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000060'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000134'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Draft partner one-pager', 1, 'Due Friday', NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000061'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000134'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Runbook updates for failover drill', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000062'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000134'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Forecast sync with leadership', 3, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000063'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000135'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Customer health scoring v2', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000064'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000135'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'IDE sync performance fix', 2, NULL, 'DROPPED', 'Blocked by upstream', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000065'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Expand pilot to EU region', 1, NULL, 'COMPLETED', 'Met Wed', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000066'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Legal review for partner terms', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000067'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Chaos test in staging', 3, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000068'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000137'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Top account outreach', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000069'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000138'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner certification prep', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000070'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000138'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'SLO dashboard tiles', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000071'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000139'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'QBR deck for Globex', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000072'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000139'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Local dev env script cleanup', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000073'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000140'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Executive readout — expansion targets', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000074'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000140'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Canary analysis for release 2.4', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000075'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000141'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Dependency upgrade batch', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000076'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000142'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'New partner onboarding checklist', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000077'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000142'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Synthetic monitor gaps', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000078'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000143'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'SMB renewal campaign', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000079'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000144'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Regional failover tabletop', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000080'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000144'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Developer survey analysis', 2, NULL, NULL, NULL, NULL);

INSERT INTO commitment (
    id,
    weekly_plan_id,
    outcome_id,
    description,
    priority,
    notes,
    actual_status,
    reconciliation_notes,
    carried_forward_from_id
) VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000081'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000145'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Discovery calls with 3 prospects', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000082'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000145'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner webinar follow-ups', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000083'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000146'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Renewal risk review — Northwind', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000084'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000146'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Post-incident action items', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000085'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000147'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'EBR prep for ACME', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000086'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000147'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'CI cache experiment', 2, NULL, 'DROPPED', 'Pivoted to hotfix week', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000087'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000148'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Co-marketing asset draft', 1, NULL, 'NOT_STARTED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000088'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000148'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Error budget report', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000089'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000149'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Pipeline scrub with sales', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000090'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000149'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner portal feedback synthesis', 2, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000091'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000150'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Schedule executive business review with ACME', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000092'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000150'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Document on-call handoff improvements', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000093'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000151'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Spike: deploy pipeline parallelism', 1, 'Next week focus', NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000094'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000152'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner QBR slides', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000095'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000153'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Territory planning workshop', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000096'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000153'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Latency regression triage', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000097'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000154'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Mid-market outreach blitz', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000098'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000155'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Alliance newsletter draft', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000099'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000155'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Gradle cache rollout', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000100'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000156'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Draft partner one-pager', 1, 'Due Friday', NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000101'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000156'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Runbook updates for failover drill', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000102'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000156'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Forecast sync with leadership', 3, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000103'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000157'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Customer health scoring v2', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000104'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000157'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'IDE sync performance fix', 2, NULL, 'DROPPED', 'Blocked by upstream', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000105'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Expand pilot to EU region', 1, NULL, 'COMPLETED', 'Met Wed', NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000106'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Legal review for partner terms', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000107'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Chaos test in staging', 3, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000108'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000159'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Top account outreach', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000109'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000160'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'Partner certification prep', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000110'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000160'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'SLO dashboard tiles', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000111'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000161'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'QBR deck for Globex', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000112'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000161'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Local dev env script cleanup', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000113'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000162'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'Executive readout — expansion targets', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000114'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000162'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Canary analysis for release 2.4', 2, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000115'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000163'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Dependency upgrade batch', 1, NULL, 'PARTIALLY_COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000116'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000164'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'New partner onboarding checklist', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000117'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000164'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Synthetic monitor gaps', 2, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000118'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000165'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'SMB renewal campaign', 1, NULL, 'COMPLETED', NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000119'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000166'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'Regional failover tabletop', 1, NULL, NULL, NULL, NULL),
    ('bbbbbbbb-bbbb-4bbb-8bbb-000000000120'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000166'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'Developer survey analysis', 2, NULL, NULL, NULL, NULL);

-- ── Plan state transitions (sample audit trail; not exhaustive) ─────────────

INSERT INTO plan_state_transition (id, weekly_plan_id, from_status, to_status, triggered_by, transitioned_at)
VALUES
    ('cccccccc-cccc-4ccc-8ccc-000000000001'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000112'::uuid, 'DRAFT', 'LOCKED', 'bob', TIMESTAMP '2026-03-27 16:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000002'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, 'DRAFT', 'LOCKED', 'carol', TIMESTAMP '2026-03-28 14:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000003'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000114'::uuid, 'LOCKED', 'RECONCILING', 'carol', TIMESTAMP '2026-03-29 10:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000004'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000122'::uuid, 'DRAFT', 'LOCKED', 'eve', TIMESTAMP '2026-03-28 09:00:00+00');

-- State transitions for duplicated locked / reconciling weeks
INSERT INTO plan_state_transition (id, weekly_plan_id, from_status, to_status, triggered_by, transitioned_at)
VALUES
    ('cccccccc-cccc-4ccc-8ccc-000000000005'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000134'::uuid, 'DRAFT', 'LOCKED', 'bob-b', TIMESTAMP '2026-03-27 16:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000006'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, 'DRAFT', 'LOCKED', 'carol-b', TIMESTAMP '2026-03-28 14:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000007'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000136'::uuid, 'LOCKED', 'RECONCILING', 'carol-b', TIMESTAMP '2026-03-29 10:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000008'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000144'::uuid, 'DRAFT', 'LOCKED', 'eve-b', TIMESTAMP '2026-03-28 09:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000009'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000156'::uuid, 'DRAFT', 'LOCKED', 'bob-c', TIMESTAMP '2026-03-27 16:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000010'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, 'DRAFT', 'LOCKED', 'carol-c', TIMESTAMP '2026-03-28 14:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000011'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000158'::uuid, 'LOCKED', 'RECONCILING', 'carol-c', TIMESTAMP '2026-03-29 10:00:00+00'),
    ('cccccccc-cccc-4ccc-8ccc-000000000012'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-000000000166'::uuid, 'DRAFT', 'LOCKED', 'eve-c', TIMESTAMP '2026-03-28 09:00:00+00');

COMMIT;
