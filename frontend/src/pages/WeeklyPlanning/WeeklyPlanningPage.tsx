import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { DEFAULT_TEAM_MEMBER_IDS } from '../../constants/teamMemberIds';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ActionBar } from '../../components/ActionBar/ActionBar';
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
} from '../../api/types';
import type { BadgeVariant } from '../../components/Badge/Badge';
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

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekStale(weekStartDate: string): boolean {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  // Friday = weekStart + 4 days, end of Friday = 23:59:59
  const friday = new Date(year, month - 1, day + 4, 23, 59, 59, 999);
  return new Date() > friday;
}

export const WeeklyPlanningPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planIdParam = searchParams.get('planId');
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = getTodayDate();
      const fetchedPlan = planIdParam
        ? await api.plans.getPlanById(planIdParam)
        : await api.plans.getPlan(today);

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
  }, [api, planIdParam, userContext.role, memberIdsFromUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshCommitments = useCallback(async () => {
    if (!plan) return;
    const fetched = await api.commitments.listCommitments(plan.id);
    setCommitments(fetched);
  }, [api, plan]);

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

    // Validate: no archived outcomes
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

  return (
    <div className={styles.page}>
      <PageHeader
        title={pageTitle}
        badge={badge}
        actions={
          readOnly ? undefined : (
            <ActionBar
              planStatus={plan.status}
              onLock={handleLock}
              onAddCommitment={handleAddCommitment}
              onStartReconciliation={handleStartReconciliation}
              locking={locking}
            />
          )
        }
      />

      {readOnly && (
        <p className={styles.readOnlyNote} data-testid="read-only-banner">
          You are viewing this person&apos;s commitments in read-only mode.
        </p>
      )}

      {showTeamPicker && (
        <div className={styles.personToolbar} data-testid="commitments-person-picker">
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

      {weekStale && (
        <div className={styles.staleBanner} data-testid="stale-week-banner">
          This week has ended. Visit reconciliation to review your commitments.{' '}
          <a href="/reconciliation" className={styles.staleLink}>Go to Reconciliation</a>
        </div>
      )}

      {showCarryForwardBanner && (
        <CarryForwardBanner
          carriedForwardCount={carriedForwardCount}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <div className={styles.body}>
        {treeIsEmpty ? (
          <EmptyState
            title="No strategies found"
            description="No rally cries, objectives, or outcomes have been configured yet."
          />
        ) : (
          <StrategyBrowser tree={tree} />
        )}
        {commitments.length === 0 ? (
          <EmptyState
            title="No commitments yet"
            description={
              readOnly
                ? 'This plan has no commitments for this week.'
                : 'Add your first commitment to start planning your week.'
            }
            action={isDraft && !readOnly ? { label: 'Add Commitment', onClick: handleAddCommitment } : undefined}
          />
        ) : (
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
        )}
      </div>

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
