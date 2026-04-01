import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StatCard } from '../../components/StatCard/StatCard';
import { TeamMembersTable } from '../../components/TeamMembersTable/TeamMembersTable';
import { CoveragePanel } from '../../components/CoveragePanel/CoveragePanel';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import { TeamOverviewResponse } from '../../api/types';
import { DEFAULT_TEAM_MEMBER_IDS } from '../../constants/teamMemberIds';
import styles from './ManagerDashboardPage.module.css';

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(year, month - 1, day + diff);
  const y = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function formatWeekRange(dateStr: string): string {
  const monday = getMonday(dateStr);
  const [year, month, day] = monday.split('-').map(Number);
  const mon = new Date(year, month - 1, day);
  const fri = new Date(year, month - 1, day + 4);
  const monLabel = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const friLabel = fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${monLabel} \u2013 ${friLabel}, ${year}`;
}

export const ManagerDashboardPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const memberIds = useMemo(() => {
    const ids = searchParams.getAll('memberIds');
    return ids.length > 0 ? ids : DEFAULT_TEAM_MEMBER_IDS;
  }, [searchParams]);

  const [currentDate, setCurrentDate] = useState(getTodayDate);
  const [data, setData] = useState<TeamOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const loadData = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.dashboard.getTeamOverview(date, memberIds);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [api, memberIds]);

  useEffect(() => {
    loadData(currentDate);
  }, [loadData, currentDate]);

  const handleWeekChange = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

  const handleUnlock = useCallback(async (planId: string) => {
    try {
      await api.plans.unlockPlan(planId);
      await loadData(currentDate);
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to unlock plan');
    }
  }, [api, currentDate, loadData]);

  const handleViewPlan = useCallback(
    (planId: string) => {
      const params = new URLSearchParams();
      memberIds.forEach(id => params.append('memberIds', id));
      params.set('planId', planId);
      navigate(`/commitments?${params.toString()}`);
    },
    [navigate, memberIds],
  );

  // Role guard: redirect IC users
  if (userContext.role === 'IC') {
    return <Navigate to="/commitments" replace />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error && !data) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!data) {
    return <div className={styles.error}>No data available</div>;
  }

  const subtitle = formatWeekRange(currentDate);
  const completionDisplay = data.stats.avgCompletionRate !== null
    ? `${Math.round(data.stats.avgCompletionRate)}%`
    : '\u2014';
  const lockedDisplay = `${data.stats.plansLocked}/${data.stats.directReports}`;

  return (
    <div className={styles.page} data-testid="manager-dashboard">
      <PageHeader
        title="Team Dashboard"
        actions={
          <WeekNavigator currentDate={currentDate} onWeekChange={handleWeekChange} />
        }
      />
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.statsRow}>
        <StatCard label="Direct Reports" value={data.stats.directReports} />
        <StatCard label="Plans Locked" value={lockedDisplay} valueColor="#16A34A" />
        <StatCard label="Total Commitments" value={data.stats.totalCommitments} />
        <StatCard label="Avg Completion" value={completionDisplay} valueColor="#16A34A" />
      </div>

      <div className={styles.bottom}>
        <TeamMembersTable
          members={data.members}
          onViewPlan={handleViewPlan}
          onUnlock={handleUnlock}
        />
        <CoveragePanel coverage={data.rallyCryCoverage} />
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
