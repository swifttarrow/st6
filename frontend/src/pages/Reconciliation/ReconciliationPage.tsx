import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { StatsBar } from '../../components/StatsBar/StatsBar';
import { ReconciliationTable } from '../../components/ReconciliationTable/ReconciliationTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import type { WeeklyPlan, Commitment, PlanStatus, ActualStatus, RcdoTreeRallyCry } from '../../api/types';
import { ApiError } from '../../api/types';
import type { BadgeVariant } from '../../components/Badge/Badge';
import styles from './ReconciliationPage.module.css';

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekRange(weekStartDate: string): string {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const monday = new Date(year, month - 1, day);
  const friday = new Date(year, month - 1, day + 4);

  const monMonth = monday.toLocaleDateString('en-US', { month: 'long' });
  const monDay = monday.getDate();
  const friDay = friday.getDate();

  // If same month
  if (monday.getMonth() === friday.getMonth()) {
    return `Reconcile Week \u2014 ${monMonth} ${monDay}\u2013${friDay}, ${year}`;
  }

  const friMonth = friday.toLocaleDateString('en-US', { month: 'long' });
  return `Reconcile Week \u2014 ${monMonth} ${monDay}\u2013${friMonth} ${friDay}, ${year}`;
}

function getStatusBadge(status: PlanStatus): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'RECONCILING':
      return { label: 'Reconciling', variant: 'alert' };
    case 'DONE':
      return { label: 'Reconciled', variant: 'success' };
    default:
      return { label: status, variant: 'default' };
  }
}

export const ReconciliationPage: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tree, setTree] = useState<RcdoTreeRallyCry[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = getTodayDate();
      let fetchedPlan: WeeklyPlan;

      try {
        fetchedPlan = await api.plans.getPlan(today);
      } catch {
        navigate('/my-week', { replace: true });
        return;
      }

      // If ACTIVE (locked), transition to RECONCILING
      if (fetchedPlan.status === 'ACTIVE') {
        fetchedPlan = await api.plans.transitionPlan(fetchedPlan.id, 'RECONCILING');
      }

      // Redirect DRAFT to /my-week (not a reconcilable state)
      if (fetchedPlan.status === 'DRAFT') {
        navigate('/my-week', { replace: true });
        return;
      }

      // Only RECONCILING and DONE are valid states for this page
      if (fetchedPlan.status !== 'RECONCILING' && fetchedPlan.status !== 'DONE') {
        navigate('/my-week', { replace: true });
        return;
      }

      const [fetchedCommitments, fetchedTree] = await Promise.all([
        api.commitments.listCommitments(fetchedPlan.id),
        api.rcdo.getTree(),
      ]);

      setPlan(fetchedPlan);
      setCommitments(fetchedCommitments);
      setTree(fetchedTree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [api, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReconcile = useCallback(async (commitmentId: string, actualStatus: ActualStatus, noteText: string) => {
    if (!plan) return;

    // Optimistically update local state
    setCommitments((prev) =>
      prev.map((c) =>
        c.id === commitmentId ? { ...c, actualStatus } : c,
      ),
    );

    try {
      await api.commitments.reconcileCommitment(plan.id, commitmentId, {
        commitmentId,
        actualStatus,
      });
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to update commitment status');
      // Revert on error
      const refreshed = await api.commitments.listCommitments(plan.id);
      setCommitments(refreshed);
    }
  }, [api, plan]);

  const handleNotesChange = useCallback((commitmentId: string, noteText: string) => {
    setNotes((prev) => ({ ...prev, [commitmentId]: noteText }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!plan) return;
    setSubmitting(true);
    setToastError(null);

    try {
      const updated = await api.plans.transitionPlan(plan.id, 'DONE');
      setPlan(updated);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setToastError('This plan has already been reconciled or is in a conflicting state.');
      } else {
        setToastError(err instanceof Error ? err.message : 'Failed to submit reconciliation');
      }
    } finally {
      setSubmitting(false);
    }
  }, [api, plan]);

  if (loading) {
    return <div className={styles.loading} data-testid="loading">Loading...</div>;
  }

  if (error && !plan) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!plan) {
    return <div className={styles.error}>No plan found</div>;
  }

  const isReconciled = plan.status === 'DONE';
  const allAnnotated = commitments.length > 0 && commitments.every(
    (c) => c.actualStatus !== 'PENDING',
  );

  const badge = getStatusBadge(plan.status);
  const title = formatWeekRange(plan.weekStartDate);

  return (
    <div className={styles.page}>
      <PageHeader title={title} badge={badge} />

      <div className={styles.body}>
        <StatsBar commitments={commitments} />

        {commitments.length === 0 ? (
          <EmptyState
            title="No commitments to reconcile"
            description="There are no commitments for this week. Go back to planning to add commitments."
            action={{ label: 'Go to Planning', onClick: () => navigate('/my-week') }}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <ReconciliationTable
                commitments={commitments}
                planStatus={plan.status}
                tree={tree}
                onReconcile={handleReconcile}
                notes={notes}
                onNotesChange={handleNotesChange}
              />
            </div>

            {!isReconciled && (
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.submitButton}
                  disabled={!allAnnotated || submitting}
                  onClick={handleSubmit}
                  data-testid="submit-reconciliation"
                >
                  <svg className={styles.checkIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                  {submitting ? 'Submitting...' : 'Submit Reconciliation'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toastError && (
        <ErrorToast
          message={toastError}
          onDismiss={() => setToastError(null)}
        />
      )}
    </div>
  );
};
