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
import type { CoveragePanelItem } from '../../components/CoveragePanel/CoveragePanel';
import { getTodayDate, formatWeekRange } from '../../utils/weekDates';
import styles from './ManagerDashboardPage.module.css';

export const ManagerDashboardPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const memberIds = useMemo(() => {
    const ids = searchParams.getAll('memberIds');
    if (ids.length > 0) return ids;
    if (userContext.directReportIds && userContext.directReportIds.length > 0) {
      return userContext.directReportIds;
    }
    return [];
  }, [searchParams, userContext.directReportIds]);

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

  const rallyCryItems: CoveragePanelItem[] = data.rallyCryCoverage.map((rc) => ({
    id: rc.rallyCryId,
    label: rc.rallyCryName,
    commitmentCount: rc.commitmentCount,
    memberCount: rc.memberCount,
    consecutiveZeroWeeks: rc.consecutiveZeroWeeks,
  }));

  const definingObjectiveItems: CoveragePanelItem[] = data.definingObjectiveCoverage.map((d) => ({
    id: d.definingObjectiveId,
    label: d.definingObjectiveName,
    subtitle: d.rallyCryName,
    commitmentCount: d.commitmentCount,
    memberCount: d.memberCount,
    consecutiveZeroWeeks: d.consecutiveZeroWeeks,
  }));

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
        <div className={styles.coverageColumn}>
          <CoveragePanel
            title="Rally cry coverage"
            items={rallyCryItems}
            testId="rally-cry-coverage-panel"
          />
          <CoveragePanel
            title="Defining objective coverage"
            items={definingObjectiveItems}
            itemTestIdPrefix="do-coverage-item"
            testId="defining-objective-coverage-panel"
          />
        </div>
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
