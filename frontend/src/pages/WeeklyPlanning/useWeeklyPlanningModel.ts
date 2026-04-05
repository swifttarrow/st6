import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import {
  Commitment,
  MyPlanSummary,
  PlanStatus,
  RcdoTreeRallyCry,
  TeamOverviewResponse,
  WeeklyPlan,
} from '../../api/types';
import { addWeeks, getMonday, getTodayDate } from '../../utils/weekDates';

function reconciliationPath(weekStartDate: string): string {
  return `/reconciliation?week=${encodeURIComponent(weekStartDate)}`;
}

function commitmentsPath(weekStartDate: string): string {
  return `/commitments?week=${encodeURIComponent(weekStartDate)}`;
}

function isWeekStale(weekStartDate: string): boolean {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const friday = new Date(year, month - 1, day + 4, 23, 59, 59, 999);
  return new Date() > friday;
}

export function useWeeklyPlanningModel() {
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
    if (ids.length > 0) return ids;
    if (userContext.directReportIds && userContext.directReportIds.length > 0) {
      return userContext.directReportIds;
    }
    return [];
  }, [searchParams, userContext.directReportIds]);

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
  const [priorWeekAttention, setPriorWeekAttention] = useState<{
    weekStartDate: string;
    status: PlanStatus;
  } | null>(null);

  const handleWeekChange = useCallback(
    (nextDate: string) => {
      const monday = getMonday(nextDate);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('week', monday);
          params.delete('planId');
          return params;
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
      setPriorWeekAttention(null);
      const fetchedPlan = planIdParam
        ? await api.plans.getPlanById(planIdParam)
        : await api.plans.getPlan(weekMonday);

      const loadTeamPicker =
        userContext.role === 'MANAGER' || userContext.role === 'LEADERSHIP';

      const checkOwnPriorWeek = fetchedPlan.userId === userContext.userId;
      const priorWeekMonday = addWeeks(fetchedPlan.weekStartDate, -1);

      const [fetchedTree, overview, fetchedCommitments, priorWeekRows] = await Promise.all([
        api.rcdo.getTree(),
        loadTeamPicker
          ? api.dashboard.getTeamOverview(fetchedPlan.weekStartDate, memberIdsFromUrl).catch(() => null)
          : Promise.resolve(null),
        api.commitments.listCommitments(fetchedPlan.id),
        checkOwnPriorWeek
          ? api.plans.listMyPlans(
              priorWeekMonday,
              priorWeekMonday,
            ).catch(() => [] as MyPlanSummary[])
          : Promise.resolve(null),
      ]);

      setPlan(fetchedPlan);
      setTree(fetchedTree);
      setTeamOverview(overview);
      setCommitments(fetchedCommitments);

      let nextPriorWeekAttention: typeof priorWeekAttention = null;
      if (priorWeekRows) {
        const row = priorWeekRows[0];
        if (row && row.status !== 'RECONCILED') {
          nextPriorWeekAttention = { weekStartDate: row.weekStartDate, status: row.status };
        }
      }

      if (!nextPriorWeekAttention && overview) {
        const selectedMember = overview.members.find((member) => member.userId === fetchedPlan.userId);
        if (selectedMember?.priorWeekStartDate && selectedMember.priorWeekStatus) {
          nextPriorWeekAttention = {
            weekStartDate: selectedMember.priorWeekStartDate,
            status: selectedMember.priorWeekStatus as PlanStatus,
          };
        }
      }

      setPriorWeekAttention(nextPriorWeekAttention);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [api, memberIdsFromUrl, planIdParam, userContext.role, userContext.userId, weekMonday]);

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
    const readOnly = plan.userId !== userContext.userId;
    if (planIdParam || readOnly) return;

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

  const readOnly = useMemo(
    () => Boolean(plan && plan.userId !== userContext.userId),
    [plan, userContext.userId],
  );

  const weekStale = useMemo(
    () => (plan ? isWeekStale(plan.weekStartDate) : false),
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
  }, [api, archivedOutcomeCount, plan]);

  const handleStartReconciliation = useCallback(async () => {
    if (!plan) return;
    try {
      const updated = await api.plans.transitionPlan(plan.id, 'RECONCILING');
      setPlan(updated);
      navigate(reconciliationPath(updated.weekStartDate));
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to start reconciliation');
    }
  }, [api, navigate, plan]);

  const handleViewReconciliation = useCallback(() => {
    if (!plan) return;
    navigate(reconciliationPath(plan.weekStartDate));
  }, [navigate, plan]);

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
          outcomeId: data.outcomeId,
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
  }, [api, editingCommitment, plan, refreshCommitments]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingCommitment(null);
  }, []);

  const handlePersonSelect = useCallback((nextPlanId: string | null) => {
    const explicitMemberIds = searchParams.getAll('memberIds');
    const params = new URLSearchParams();
    explicitMemberIds.forEach(id => params.append('memberIds', id));
    const week = searchParams.get('week');
    if (week) params.set('week', getMonday(week));
    if (nextPlanId) params.set('planId', nextPlanId);
    const queryString = params.toString();
    navigate(queryString ? `/commitments?${queryString}` : '/commitments');
  }, [navigate, searchParams]);

  const dismissCarryForwardBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const dismissToastError = useCallback(() => {
    setToastError(null);
  }, []);

  const teamPickerMembers = teamOverview?.members ?? [];
  const showTeamPicker =
    (userContext.role === 'MANAGER' || userContext.role === 'LEADERSHIP') &&
    teamPickerMembers.length > 0;

  const showWeekNavigator = !planIdParam;
  const weekNavDate = plan ? plan.weekStartDate : weekMonday;

  const openCommitmentsWeek = useCallback((weekStartDate: string) => {
    navigate(commitmentsPath(weekStartDate));
  }, [navigate]);

  const searchOutcomes = useCallback(
    (query: string) => api.rcdo.searchOutcomes(query),
    [api],
  );

  return {
    planIdParam,
    weekMonday,
    plan,
    commitments,
    tree,
    loading,
    error,
    toastError,
    showForm,
    editingCommitment,
    bannerDismissed,
    locking,
    saving,
    myPlanHistory,
    historyLoading,
    priorWeekAttention,
    carriedForwardCount,
    archivedOutcomeCount,
    readOnly,
    weekStale,
    teamPickerMembers,
    showTeamPicker,
    showWeekNavigator,
    weekNavDate,
    handleWeekChange,
    handleLock,
    handleStartReconciliation,
    handleViewReconciliation,
    handleAddCommitment,
    handleEditCommitment,
    handleRelink,
    handleDeleteCommitment,
    handleReorder,
    handleFormSubmit,
    handleFormCancel,
    handlePersonSelect,
    dismissCarryForwardBanner,
    dismissToastError,
    openCommitmentsWeek,
    searchOutcomes,
  };
}
