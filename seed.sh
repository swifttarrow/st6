#!/usr/bin/env bash
#
# Seed script for Weekly Commitment Tracker
# Prerequisites: backend running on localhost:8080, jq installed
#
set -euo pipefail

BASE="http://localhost:8080"
MGR_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: mgr-1" -H "X-User-Role: MANAGER" -H "X-Team-Id: team-alpha" -H "X-Manager-Id: vp-1")
IC1_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: ic-alice" -H "X-User-Role: IC" -H "X-Team-Id: team-alpha" -H "X-Manager-Id: mgr-1")
IC2_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: ic-bob" -H "X-User-Role: IC" -H "X-Team-Id: team-alpha" -H "X-Manager-Id: mgr-1")
IC3_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: ic-carol" -H "X-User-Role: IC" -H "X-Team-Id: team-alpha" -H "X-Manager-Id: mgr-1")
IC4_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: ic-dana" -H "X-User-Role: IC" -H "X-Team-Id: team-beta" -H "X-Manager-Id: mgr-2")
IC5_HEADERS=(-H "Content-Type: application/json" -H "X-User-Id: ic-evan" -H "X-User-Role: IC" -H "X-Team-Id: team-beta" -H "X-Manager-Id: mgr-2")

echo "=== Creating RCDO Hierarchy ==="

RC1=$(curl -s -X POST "$BASE/api/rcdo/rally-cries" "${MGR_HEADERS[@]}" \
  -d '{"name": "Revenue Growth", "description": "Grow ARR by 40% this year"}' | jq -r '.id')
echo "  Rally Cry 1: Revenue Growth ($RC1)"

RC2=$(curl -s -X POST "$BASE/api/rcdo/rally-cries" "${MGR_HEADERS[@]}" \
  -d '{"name": "Customer Retention", "description": "Reduce churn to under 5%"}' | jq -r '.id')
echo "  Rally Cry 2: Customer Retention ($RC2)"

RC3=$(curl -s -X POST "$BASE/api/rcdo/rally-cries" "${MGR_HEADERS[@]}" \
  -d '{"name": "Expand into APAC", "description": "Launch in 3 APAC markets"}' | jq -r '.id')
echo "  Rally Cry 3: Expand into APAC ($RC3)"

RC4=$(curl -s -X POST "$BASE/api/rcdo/rally-cries" "${MGR_HEADERS[@]}" \
  -d '{"name": "Platform Reliability", "description": "99.9% uptime SLA"}' | jq -r '.id')
echo "  Rally Cry 4: Platform Reliability ($RC4)"

# DOs under RC1
DO1=$(curl -s -X POST "$BASE/api/rcdo/defining-objectives" "${MGR_HEADERS[@]}" \
  -d "{\"rallyCryId\": \"$RC1\", \"name\": \"Increase Enterprise Pipeline\", \"description\": \"Land 20 new enterprise leads\"}" | jq -r '.id')
echo "    DO 1.1: Increase Enterprise Pipeline ($DO1)"

DO2=$(curl -s -X POST "$BASE/api/rcdo/defining-objectives" "${MGR_HEADERS[@]}" \
  -d "{\"rallyCryId\": \"$RC1\", \"name\": \"Improve Onboarding Flow\", \"description\": \"Reduce time-to-value for new customers\"}" | jq -r '.id')
echo "    DO 1.2: Improve Onboarding Flow ($DO2)"

# DOs under RC2
DO3=$(curl -s -X POST "$BASE/api/rcdo/defining-objectives" "${MGR_HEADERS[@]}" \
  -d "{\"rallyCryId\": \"$RC2\", \"name\": \"Reduce Churn by 15%\", \"description\": \"Proactive retention programs\"}" | jq -r '.id')
echo "    DO 2.1: Reduce Churn by 15% ($DO3)"

# DOs under RC4
DO4=$(curl -s -X POST "$BASE/api/rcdo/defining-objectives" "${MGR_HEADERS[@]}" \
  -d "{\"rallyCryId\": \"$RC4\", \"name\": \"Improve Monitoring\", \"description\": \"Full observability stack\"}" | jq -r '.id')
echo "    DO 4.1: Improve Monitoring ($DO4)"

# Outcomes under DO1
OC1=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO1\", \"name\": \"Launch Partner API\", \"description\": \"OAuth2 partner integration\"}" | jq -r '.id')
echo "      OC 1.1.1: Launch Partner API ($OC1)"

OC2=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO1\", \"name\": \"Enterprise Demo Portal\", \"description\": \"Self-serve demo environment\"}" | jq -r '.id')
echo "      OC 1.1.2: Enterprise Demo Portal ($OC2)"

# Outcomes under DO2
OC3=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO2\", \"name\": \"1-Step OAuth Integration\", \"description\": \"Single-click sign-up flow\"}" | jq -r '.id')
echo "      OC 1.2.1: 1-Step OAuth Integration ($OC3)"

OC4=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO2\", \"name\": \"A/B Test Hero Copy\", \"description\": \"Optimize landing page conversion\"}" | jq -r '.id')
echo "      OC 1.2.2: A/B Test Hero Copy ($OC4)"

# Outcomes under DO3
OC5=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO3\", \"name\": \"Health Score Dashboard\", \"description\": \"Customer health scoring\"}" | jq -r '.id')
echo "      OC 2.1.1: Health Score Dashboard ($OC5)"

OC6=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO3\", \"name\": \"Churn Prediction Model\", \"description\": \"ML-based churn prediction\"}" | jq -r '.id')
echo "      OC 2.1.2: Churn Prediction Model ($OC6)"

# Outcomes under DO4
OC7=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO4\", \"name\": \"Distributed Tracing\", \"description\": \"End-to-end request tracing\"}" | jq -r '.id')
echo "      OC 4.1.1: Distributed Tracing ($OC7)"

OC8=$(curl -s -X POST "$BASE/api/rcdo/outcomes" "${MGR_HEADERS[@]}" \
  -d "{\"definingObjectiveId\": \"$DO4\", \"name\": \"Alerting Pipeline\", \"description\": \"PagerDuty integration\"}" | jq -r '.id')
echo "      OC 4.1.2: Alerting Pipeline ($OC8)"

echo ""
echo "=== Creating Weekly Plans & Commitments ==="

# Get today's date
TODAY=$(date +%Y-%m-%d)

# --- Alice: 5 commitments, will LOCK ---
echo ""
echo "  Alice (ic-alice) — 5 commitments, LOCKED"
PLAN_ALICE=$(curl -s "$BASE/api/plans?date=$TODAY" "${IC1_HEADERS[@]}" | jq -r '.id')

curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/commitments" "${IC1_HEADERS[@]}" \
  -d "{\"description\": \"Implement OAuth2 flow for partner API\", \"outcomeId\": \"$OC1\", \"notes\": \"Blocked on security review\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/commitments" "${IC1_HEADERS[@]}" \
  -d "{\"description\": \"Write integration test suite for webhook handlers\", \"outcomeId\": \"$OC1\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/commitments" "${IC1_HEADERS[@]}" \
  -d "{\"description\": \"Draft RFC for event-driven notification system\", \"outcomeId\": \"$OC3\", \"notes\": \"Need input from platform team\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/commitments" "${IC1_HEADERS[@]}" \
  -d "{\"description\": \"Review and merge pending PRs for SDK docs\", \"outcomeId\": \"$OC2\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/commitments" "${IC1_HEADERS[@]}" \
  -d "{\"description\": \"Conduct user interview sessions for onboarding feedback\", \"outcomeId\": \"$OC4\"}" > /dev/null

curl -s -X POST "$BASE/api/plans/$PLAN_ALICE/transition" "${IC1_HEADERS[@]}" \
  -d '{"targetStatus": "LOCKED"}' > /dev/null
echo "    Plan locked with 5 commitments"

# --- Bob: 4 commitments, DRAFT ---
echo ""
echo "  Bob (ic-bob) — 4 commitments, DRAFT"
PLAN_BOB=$(curl -s "$BASE/api/plans?date=$TODAY" "${IC2_HEADERS[@]}" | jq -r '.id')

curl -s -X POST "$BASE/api/plans/$PLAN_BOB/commitments" "${IC2_HEADERS[@]}" \
  -d "{\"description\": \"Build health score calculation engine\", \"outcomeId\": \"$OC5\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_BOB/commitments" "${IC2_HEADERS[@]}" \
  -d "{\"description\": \"Design churn prediction data pipeline\", \"outcomeId\": \"$OC6\", \"notes\": \"Waiting on data lake access\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_BOB/commitments" "${IC2_HEADERS[@]}" \
  -d "{\"description\": \"Set up distributed tracing for auth service\", \"outcomeId\": \"$OC7\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_BOB/commitments" "${IC2_HEADERS[@]}" \
  -d "{\"description\": \"Write runbook for alerting escalation\", \"outcomeId\": \"$OC8\"}" > /dev/null
echo "    Plan in DRAFT with 4 commitments"

# --- Carol: 3 commitments, fully RECONCILED ---
echo ""
echo "  Carol (ic-carol) — 3 commitments, RECONCILED"
PLAN_CAROL=$(curl -s "$BASE/api/plans?date=$TODAY" "${IC3_HEADERS[@]}" | jq -r '.id')

curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/commitments" "${IC3_HEADERS[@]}" \
  -d "{\"description\": \"Ship enterprise demo portal v1\", \"outcomeId\": \"$OC2\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/commitments" "${IC3_HEADERS[@]}" \
  -d "{\"description\": \"Run A/B test on landing page hero\", \"outcomeId\": \"$OC4\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/commitments" "${IC3_HEADERS[@]}" \
  -d "{\"description\": \"Customer interview synthesis report\", \"outcomeId\": \"$OC5\", \"notes\": \"5 interviews scheduled\"}" > /dev/null

# Lock → Reconcile → Complete
curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/transition" "${IC3_HEADERS[@]}" \
  -d '{"targetStatus": "LOCKED"}' > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/transition" "${IC3_HEADERS[@]}" \
  -d '{"targetStatus": "RECONCILING"}' > /dev/null

# Get commitment IDs for reconciliation
CAROL_COMMITS=$(curl -s "$BASE/api/plans/$PLAN_CAROL/commitments" "${IC3_HEADERS[@]}")
C_ID1=$(echo "$CAROL_COMMITS" | jq -r '.[0].id')
C_ID2=$(echo "$CAROL_COMMITS" | jq -r '.[1].id')
C_ID3=$(echo "$CAROL_COMMITS" | jq -r '.[2].id')

curl -s -X PATCH "$BASE/api/plans/$PLAN_CAROL/commitments/$C_ID1/reconcile" "${IC3_HEADERS[@]}" \
  -d '{"actualStatus": "COMPLETED", "reconciliationNotes": "Shipped on Wednesday"}' > /dev/null
curl -s -X PATCH "$BASE/api/plans/$PLAN_CAROL/commitments/$C_ID2/reconcile" "${IC3_HEADERS[@]}" \
  -d '{"actualStatus": "PARTIALLY_COMPLETED", "reconciliationNotes": "Test running, results next week"}' > /dev/null
curl -s -X PATCH "$BASE/api/plans/$PLAN_CAROL/commitments/$C_ID3/reconcile" "${IC3_HEADERS[@]}" \
  -d '{"actualStatus": "COMPLETED", "reconciliationNotes": "Report delivered to stakeholders"}' > /dev/null

curl -s -X POST "$BASE/api/plans/$PLAN_CAROL/transition" "${IC3_HEADERS[@]}" \
  -d '{"targetStatus": "RECONCILED"}' > /dev/null
echo "    Plan RECONCILED — 2 completed, 1 partial (will carry forward)"

# --- Dana (team-beta): 3 commitments, LOCKED ---
echo ""
echo "  Dana (ic-dana, team-beta) — 3 commitments, LOCKED"
PLAN_DANA=$(curl -s "$BASE/api/plans?date=$TODAY" "${IC4_HEADERS[@]}" | jq -r '.id')

curl -s -X POST "$BASE/api/plans/$PLAN_DANA/commitments" "${IC4_HEADERS[@]}" \
  -d "{\"description\": \"Configure PagerDuty integration\", \"outcomeId\": \"$OC8\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_DANA/commitments" "${IC4_HEADERS[@]}" \
  -d "{\"description\": \"Deploy tracing sidecar to staging\", \"outcomeId\": \"$OC7\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_DANA/commitments" "${IC4_HEADERS[@]}" \
  -d "{\"description\": \"Write partner API documentation\", \"outcomeId\": \"$OC1\"}" > /dev/null

curl -s -X POST "$BASE/api/plans/$PLAN_DANA/transition" "${IC4_HEADERS[@]}" \
  -d '{"targetStatus": "LOCKED"}' > /dev/null
echo "    Plan locked with 3 commitments"

# --- Evan (team-beta): 2 commitments, DRAFT ---
echo ""
echo "  Evan (ic-evan, team-beta) — 2 commitments, DRAFT"
PLAN_EVAN=$(curl -s "$BASE/api/plans?date=$TODAY" "${IC5_HEADERS[@]}" | jq -r '.id')

curl -s -X POST "$BASE/api/plans/$PLAN_EVAN/commitments" "${IC5_HEADERS[@]}" \
  -d "{\"description\": \"Build customer health score UI\", \"outcomeId\": \"$OC5\"}" > /dev/null
curl -s -X POST "$BASE/api/plans/$PLAN_EVAN/commitments" "${IC5_HEADERS[@]}" \
  -d "{\"description\": \"Prototype churn prediction dashboard\", \"outcomeId\": \"$OC6\"}" > /dev/null
echo "    Plan in DRAFT with 2 commitments"

echo ""
echo "=== Seed Complete ==="
echo ""
echo "Summary:"
echo "  4 Rally Cries, 4 Defining Objectives, 8 Outcomes"
echo "  5 ICs across 2 teams (team-alpha, team-beta)"
echo "  Alice: LOCKED (5 commits)    Bob: DRAFT (4 commits)"
echo "  Carol: RECONCILED (3 commits, 1 partial → will carry forward)"
echo "  Dana:  LOCKED (3 commits)    Evan: DRAFT (2 commits)"
echo ""
echo "Test with:"
echo "  IC view:         Change dev.tsx role to 'IC', userId to 'ic-alice'"
echo "  Manager view:    Change dev.tsx role to 'MANAGER', userId to 'mgr-1'"
echo "  Leadership view: Change dev.tsx role to 'LEADERSHIP', userId to 'vp-1'"
echo ""
echo "  RC3 (Expand into APAC) has ZERO commitments — shows as coverage gap"
