import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StatsBar } from '../../components/StatsBar/StatsBar';
import { ReconciliationTable } from '../../components/ReconciliationTable/ReconciliationTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import type { WeeklyPlan, Commitment, PlanStatus, ActualStatus, RcdoTreeRallyCry } from '../../api/types';
import { ApiError } from '../../api/types';
import type { BadgeVariant } from '../../components/Badge/Badge';
import { getMonday, getTodayDate } from '../../utils/weekDates';
import styles from './ReconciliationPage.module.css';

function formatWeekRange(weekStartDate: string): string {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const monday = new Date(year, month - 1, day);
  const friday = new Date(year, month - 1, day + 4);

  const monMonth = monday.toLocaleDateString('en-US', { month: 'long' });
  const monDay = monday.getDate();
  const friDay = friday.getDate();

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
    case 'RECONCILED':
      return { label: 'Reconciled', variant: 'success' };
    default:
      return { label: status, variant: 'default' };
  }
}

function commitmentsQuery(weekStart: string): string {
  return `week=${encodeURIComponent(weekStart)}`;
}

function buildNotesMap(commitments: Commitment[]): Record<string, string> {
  return Object.fromEntries(
    commitments.map((commitment) => [commitment.id, commitment.reconciliationNotes ?? '']),
  );
}

function normalizeNoteText(noteText: string): string | null {
  const normalized = noteText.trim();
  return normalized === '' ? null : normalized;
}

export const ReconciliationPage: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const weekParam = searchParams.get('week');
  const weekMonday = useMemo(
    () => getMonday(weekParam ?? getTodayDate()),
    [weekParam],
  );

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tree, setTree] = useState<RcdoTreeRallyCry[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleWeekChange = useCallback(
    (nextDate: string) => {
      const mon = getMonday(nextDate);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('week', mon);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedPlan: WeeklyPlan;

      try {
        fetchedPlan = await api.plans.getPlan(weekMonday);
      } catch {
        navigate(`/commitments?${commitmentsQuery(weekMonday)}`, { replace: true });
        return;
      }

      if (fetchedPlan.status === 'LOCKED') {
        fetchedPlan = await api.plans.transitionPlan(fetchedPlan.id, 'RECONCILING');
      }

      if (fetchedPlan.status === 'DRAFT') {
        navigate(`/commitments?${commitmentsQuery(fetchedPlan.weekStartDate)}`, { replace: true });
        return;
      }

      if (fetchedPlan.status !== 'RECONCILING' && fetchedPlan.status !== 'RECONCILED') {
        navigate(`/commitments?${commitmentsQuery(fetchedPlan.weekStartDate)}`, { replace: true });
        return;
      }

      const [fetchedCommitments, fetchedTree] = await Promise.all([
        api.commitments.listCommitments(fetchedPlan.id),
        api.rcdo.getTree(),
      ]);

      setPlan(fetchedPlan);
      setCommitments(fetchedCommitments);
      setNotes(buildNotesMap(fetchedCommitments));
      setTree(fetchedTree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [api, navigate, weekMonday]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReconcile = useCallback(async (commitmentId: string, actualStatus: ActualStatus, noteText: string) => {
    if (!plan) return;
    const normalizedNotes = normalizeNoteText(noteText);

    setCommitments((prev) =>
      prev.map((c) =>
        c.id === commitmentId ? { ...c, actualStatus, reconciliationNotes: normalizedNotes } : c,
      ),
    );
    setNotes((prev) => ({ ...prev, [commitmentId]: normalizedNotes ?? '' }));

    try {
      const updated = await api.commitments.reconcileCommitment(plan.id, commitmentId, {
        actualStatus,
        reconciliationNotes: normalizedNotes,
      });
      setCommitments((prev) =>
        prev.map((c) => (c.id === commitmentId ? updated : c)),
      );
      setNotes((prev) => ({ ...prev, [commitmentId]: updated.reconciliationNotes ?? '' }));
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to update commitment status');
      const refreshed = await api.commitments.listCommitments(plan.id);
      setCommitments(refreshed);
      setNotes(buildNotesMap(refreshed));
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
      const updated = await api.plans.transitionPlan(plan.id, 'RECONCILED');
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

  const isReconciled = plan.status === 'RECONCILED';
  const allAnnotated = commitments.every((c) => c.actualStatus != null);

  const badge = getStatusBadge(plan.status);
  const title = formatWeekRange(plan.weekStartDate);
  const navDate = plan.weekStartDate;
  const commitmentsPath = `/commitments?${commitmentsQuery(plan.weekStartDate)}`;
  const emptyStateTitle = isReconciled ? 'No commitments were planned' : 'No commitments this week';
  const emptyStateDescription = isReconciled
    ? 'This week was already reconciled without any commitments.'
    : 'There are no commitments to annotate for this week. Finish reconciliation to close out the empty week.';
  const emptyStateAction = isReconciled
    ? {
        label: 'Back to Commitments',
        onClick: () => navigate(commitmentsPath),
      }
    : {
        label: submitting ? 'Finishing...' : 'Finish Empty Week',
        onClick: handleSubmit,
        disabled: submitting,
      };

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        badge={badge}
        actions={
          <div className={styles.headerActions}>
            <WeekNavigator currentDate={navDate} onWeekChange={handleWeekChange} />
          </div>
        }
      />

      <div className={styles.body}>
        <StatsBar commitments={commitments} />

        {commitments.length === 0 ? (
          <EmptyState
            title={emptyStateTitle}
            description={emptyStateDescription}
            action={emptyStateAction}
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
