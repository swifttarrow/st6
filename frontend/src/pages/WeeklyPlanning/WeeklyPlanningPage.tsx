import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { DEFAULT_TEAM_MEMBER_IDS } from '../../constants/teamMemberIds';
import { Badge } from '../../components/Badge/Badge';
import { ActionBar } from '../../components/ActionBar/ActionBar';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StrategyBrowser } from '../../components/StrategyBrowser/StrategyBrowser';
import { CommitmentList } from '../../components/CommitmentList/CommitmentList';
import { CommitmentForm } from '../../components/CommitmentForm/CommitmentForm';
import { CarryForwardBanner } from '../../components/CarryForwardBanner/CarryForwardBanner';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import {
  WeeklyPlan,
  Commitment,
  RcdoTreeRallyCry,
  PlanStatus,
  TeamOverviewResponse,
  MyPlanSummary,
} from '../../api/types';
import type { BadgeVariant } from '../../components/Badge/Badge';
import { addWeeks, getMonday, getTodayDate } from '../../utils/weekDates';
import styles from './WeeklyPlanningPage.module.css';

function formatWeekDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHistoryWeekLabel(weekStartDate: string): string {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const mon = new Date(year, month - 1, day);
  const fri = new Date(year, month - 1, day + 4);
  const a = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const b = fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${a} – ${b}, ${year}`;
}

function getStatusBadge(status: PlanStatus): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', variant: 'default' };
    case 'LOCKED':
      return { label: 'Locked', variant: 'active' };
    case 'RECONCILING':
      return { label: 'Reconciling', variant: 'alert' };
    case 'RECONCILED':
      return { label: 'Done', variant: 'success' };
  }
}

function isWeekStale(weekStartDate: string): boolean {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const friday = new Date(year, month - 1, day + 4, 23, 59, 59, 999);
  return new Date() > friday;
}

function statusLabel(s: PlanStatus): string {
  switch (s) {
    case 'DRAFT':
      return 'Draft';
    case 'LOCKED':
      return 'Locked';
    case 'RECONCILING':
      return 'Reconciling';
    case 'RECONCILED':
      return 'Reconciled';
  }
}

export const WeeklyPlanningPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const planIdParam = searchParams.get('planId');
  const weekParam = searchParams.get('week');
  const weekMonday = useMemo(
    () => getMonday(weekParam ?? getTodayDate()),
    [weekParam],
  );

  const memberIdsFromUrl = useMemo(() => {
    const ids = searchParams.getAll('memberIds');
    return ids.length > 0 ? ids : DEFAULT_TEAM_MEMBER_IDS;
  }, [searchParams]);

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tree, setTree] = useState<RcdoTreeRallyCry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [locking, setLocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamOverview, setTeamOverview] = useState<TeamOverviewResponse | null>(null);
  const [myPlanHistory, setMyPlanHistory] = useState<MyPlanSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleWeekChange = useCallback(
    (nextDate: string) => {
      const mon = getMonday(nextDate);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('week', mon);
          p.delete('planId');
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
      const fetchedPlan = planIdParam
        ? await api.plans.getPlanById(planIdParam)
        : await api.plans.getPlan(weekMonday);

      const loadTeamPicker =
        userContext.role === 'MANAGER' || userContext.role === 'LEADERSHIP';

      const [fetchedTree, overview] = await Promise.all([
        api.rcdo.getTree(),
        loadTeamPicker
          ? api.dashboard.getTeamOverview(fetchedPlan.weekStartDate, memberIdsFromUrl).catch(() => null)
          : Promise.resolve(null),
      ]);

      setPlan(fetchedPlan);
      setTree(fetchedTree);
      setTeamOverview(overview);
      const fetchedCommitments = await api.commitments.listCommitments(fetchedPlan.id);
      setCommitments(fetchedCommitments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [api, planIdParam, weekMonday, userContext.role, memberIdsFromUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshCommitments = useCallback(async () => {
    if (!plan) return;
    const fetched = await api.commitments.listCommitments(plan.id);
    setCommitments(fetched);
  }, [api, plan]);

  useEffect(() => {
    if (!plan) return;
    const ro = plan.userId !== userContext.userId;
    if (planIdParam || ro) return;

    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const to = getMonday(getTodayDate());
        const from = addWeeks(to, -52);
        const rows = await api.plans.listMyPlans(from, to);
        if (!cancelled) setMyPlanHistory(rows);
      } catch {
        if (!cancelled) setMyPlanHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, plan, planIdParam, userContext.userId]);

  const carriedForwardCount = useMemo(
    () => commitments.filter(c => c.carriedForward).length,
    [commitments],
  );

  const archivedOutcomeCount = useMemo(
    () => commitments.filter(c => c.outcomeArchived).length,
    [commitments],
  );

  const weekStale = useMemo(
    () => plan ? isWeekStale(plan.weekStartDate) : false,
    [plan],
  );

  const handleLock = useCallback(async () => {
    if (!plan) return;

    if (archivedOutcomeCount > 0) {
      setToastError(
        `Cannot lock: ${archivedOutcomeCount} commitment(s) reference archived outcomes. Please re-link them first.`,
      );
      return;
    }

    try {
      setLocking(true);
      const updated = await api.plans.transitionPlan(plan.id, 'LOCKED');
      setPlan(updated);
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to lock plan');
    } finally {
      setLocking(false);
    }
  }, [api, plan, archivedOutcomeCount]);

  const handleStartReconciliation = useCallback(async () => {
    if (!plan) return;
    try {
      const updated = await api.plans.transitionPlan(plan.id, 'RECONCILING');
      setPlan(updated);
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to start reconciliation');
    }
  }, [api, plan]);

  const handleAddCommitment = useCallback(() => {
    setEditingCommitment(null);
    setShowForm(true);
  }, []);

  const handleEditCommitment = useCallback((commitment: Commitment) => {
    setEditingCommitment(commitment);
    setShowForm(true);
  }, []);

  const handleRelink = useCallback((commitmentId: string) => {
    const commitment = commitments.find(c => c.id === commitmentId);
    if (commitment) {
      setEditingCommitment(commitment);
      setShowForm(true);
    }
  }, [commitments]);

  const handleDeleteCommitment = useCallback(async (commitmentId: string) => {
    if (!plan) return;
    try {
      await api.commitments.deleteCommitment(plan.id, commitmentId);
      await refreshCommitments();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to delete commitment');
    }
  }, [api, plan, refreshCommitments]);

  const handleReorder = useCallback(async (orderedIds: string[]) => {
    if (!plan) return;
    try {
      const reordered = await api.commitments.reorderCommitments(plan.id, orderedIds);
      setCommitments(reordered);
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to reorder commitments');
    }
  }, [api, plan]);

  const handleFormSubmit = useCallback(async (data: { description: string; outcomeId: string }) => {
    if (!plan) return;
    try {
      setSaving(true);
      if (editingCommitment) {
        await api.commitments.updateCommitment(plan.id, editingCommitment.id, {
          description: data.description,
        });
      } else {
        await api.commitments.createCommitment(plan.id, {
          description: data.description,
          outcomeId: data.outcomeId,
        });
      }
      setShowForm(false);
      setEditingCommitment(null);
      await refreshCommitments();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to save commitment');
    } finally {
      setSaving(false);
    }
  }, [api, plan, editingCommitment, refreshCommitments]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingCommitment(null);
  }, []);

  const readOnly = useMemo(
    () => Boolean(plan && plan.userId !== userContext.userId),
    [plan, userContext.userId],
  );

  const pageTitle = useMemo(() => {
    const dateLabel = plan ? formatWeekDate(plan.weekStartDate) : '';
    if (!plan) return 'Commitments';
    if (readOnly) {
      return `Commitments \u2014 ${plan.userId} \u2014 ${dateLabel}`;
    }
    return `Commitments \u2014 ${dateLabel}`;
  }, [plan, readOnly]);

  const handlePersonSelect = useCallback(
    (nextPlanId: string | null) => {
      const explicitMemberIds = searchParams.getAll('memberIds');
      const params = new URLSearchParams();
      explicitMemberIds.forEach(id => params.append('memberIds', id));
      const w = searchParams.get('week');
      if (w) params.set('week', getMonday(w));
      if (nextPlanId) params.set('planId', nextPlanId);
      const qs = params.toString();
      navigate(qs ? `/commitments?${qs}` : '/commitments');
    },
    [navigate, searchParams],
  );

  const teamPickerMembers = teamOverview?.members ?? [];
  const showTeamPicker =
    (userContext.role === 'MANAGER' || userContext.role === 'LEADERSHIP') &&
    teamPickerMembers.length > 0;

  const showWeekNavigator = !planIdParam;
  const weekNavDate = plan ? plan.weekStartDate : weekMonday;

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error && !plan) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!plan) {
    return <div className={styles.error}>No plan found</div>;
  }

  const badge = getStatusBadge(plan.status);
  const isDraft = plan.status === 'DRAFT';
  const showCarryForwardBanner =
    isDraft && carriedForwardCount > 0 && !bannerDismissed && !readOnly;
  const treeIsEmpty = tree.length === 0;
  const showHistoryBlock = !planIdParam && !readOnly;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
        <div className={styles.toolbar}>
          {showTeamPicker && (
            <div className={styles.toolbarLeft} data-testid="commitments-person-picker">
              <label className={styles.personLabel} htmlFor="commitments-person-select">
                Person
              </label>
              <select
                id="commitments-person-select"
                className={styles.personSelect}
                value={planIdParam ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  handlePersonSelect(v === '' ? null : v);
                }}
              >
                <option value="">Me</option>
                {teamPickerMembers
                  .filter(m => m.planId)
                  .map(m => (
                    <option key={m.userId} value={m.planId!}>
                      {m.userId}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className={styles.toolbarRight}>
            <Badge label={badge.label} variant={badge.variant} />
            {showWeekNavigator && (
              <WeekNavigator currentDate={weekNavDate} onWeekChange={handleWeekChange} />
            )}
            {!readOnly && (
              <ActionBar
                planStatus={plan.status}
                onLock={handleLock}
                onAddCommitment={handleAddCommitment}
                onStartReconciliation={handleStartReconciliation}
                locking={locking}
              />
            )}
          </div>
        </div>
      </header>

      {readOnly && (
        <p className={styles.readOnlyNote} data-testid="read-only-banner">
          You are viewing this person&apos;s commitments in read-only mode.
        </p>
      )}

      {weekStale && (
        <div className={styles.staleBanner} data-testid="stale-week-banner">
          This week has ended. Visit reconciliation to review your commitments.{' '}
          <a
            href={`/reconciliation?week=${encodeURIComponent(plan.weekStartDate)}`}
            className={styles.staleLink}
          >
            Go to Reconciliation
          </a>
        </div>
      )}

      {showCarryForwardBanner && (
        <CarryForwardBanner
          carriedForwardCount={carriedForwardCount}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <div className={styles.body}>
        <div className={styles.strategyColumn}>
          {treeIsEmpty ? (
            <div className={styles.strategyFallback}>
              <EmptyState
                title="No strategies found"
                description="No rally cries, objectives, or outcomes have been configured yet."
              />
            </div>
          ) : (
            <StrategyBrowser tree={tree} />
          )}
        </div>
        <div className={styles.mainColumn}>
          {commitments.length === 0 ? (
            <div className={styles.emptyMain}>
              <EmptyState
                title="No commitments yet"
                description={
                  readOnly
                    ? 'This plan has no commitments for this week.'
                    : isDraft
                      ? 'Use Add Commitment in the toolbar to link an outcome to this week.'
                      : 'This week has no commitments yet.'
                }
              />
            </div>
          ) : (
            <div className={styles.commitmentListWrap}>
              <CommitmentList
                commitments={commitments}
                planStatus={plan.status}
                tree={tree}
                onEdit={handleEditCommitment}
                onDelete={handleDeleteCommitment}
                onReorder={handleReorder}
                onRelink={handleRelink}
                readOnly={readOnly}
              />
            </div>
          )}
        </div>
      </div>

      {showHistoryBlock && (
        <section className={styles.historySection} aria-labelledby="plan-history-heading">
          <h2 id="plan-history-heading" className={styles.historyTitle}>
            Your plan history
          </h2>
          <p className={styles.historyHint}>
            Weeks where you already have a plan (last 52 weeks). Open or reconcile without creating empty weeks.
          </p>
          {historyLoading ? (
            <p className={styles.historyHint}>Loading history…</p>
          ) : myPlanHistory.length === 0 ? (
            <p className={styles.historyHint}>No saved weeks in this range yet.</p>
          ) : (
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Status</th>
                  <th scope="col">Commitments</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myPlanHistory.map((row) => {
                  const isCurrent = row.weekStartDate === plan.weekStartDate;
                  const canReconcile =
                    row.status === 'LOCKED' || row.status === 'RECONCILING' || row.status === 'RECONCILED';
                  return (
                    <tr
                      key={row.id}
                      className={isCurrent ? styles.historyRowCurrent : undefined}
                    >
                      <td>{formatHistoryWeekLabel(row.weekStartDate)}</td>
                      <td>{statusLabel(row.status)}</td>
                      <td>{row.commitmentCount}</td>
                      <td>
                        <div className={styles.historyActions}>
                          <a
                            className={styles.historyLink}
                            href={`/commitments?week=${encodeURIComponent(row.weekStartDate)}`}
                          >
                            Open
                          </a>
                          {canReconcile && (
                            <a
                              className={styles.historyLink}
                              href={`/reconciliation?week=${encodeURIComponent(row.weekStartDate)}`}
                            >
                              Reconcile
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {showForm && !readOnly && (
        <CommitmentForm
          mode={editingCommitment ? 'edit' : 'create'}
          commitment={editingCommitment ?? undefined}
          tree={tree}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {toastError && (
        <ErrorToast
          message={toastError}
          onDismiss={() => setToastError(null)}
        />
      )}
    </div>
  );
};
