import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StatCard } from '../../components/StatCard/StatCard';
import { HierarchyCoverageTable } from '../../components/HierarchyCoverageTable/HierarchyCoverageTable';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import { OrgOverviewResponse } from '../../api/types';
import { getTodayDate, formatWeekRange } from '../../utils/weekDates';
import styles from './LeadershipViewPage.module.css';

export const LeadershipViewPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();

  const [currentDate, setCurrentDate] = useState(getTodayDate);
  const [data, setData] = useState<OrgOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const loadData = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.dashboard.getOrgOverview(date);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization overview');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData(currentDate);
  }, [loadData, currentDate]);

  const handleWeekChange = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

  // Role guard: redirect non-LEADERSHIP to /commitments
  if (userContext.role !== 'LEADERSHIP') {
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

  const subtitle = `Cross-team strategic alignment \u2014 ${formatWeekRange(currentDate)}`;

  return (
    <div className={styles.page} data-testid="leadership-view">
      <PageHeader
        title="Organization Overview"
        actions={
          <WeekNavigator currentDate={currentDate} onWeekChange={handleWeekChange} />
        }
      />
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.statsRow}>
        <StatCard label="Total Teams" value={data.stats.totalTeams} />
        <StatCard label="Active Rally Cries" value={data.stats.activeRallyCries} />
        <StatCard label="Org Commitments" value={data.stats.orgCommitments} />
        <StatCard
          label="Coverage Gaps"
          value={data.stats.coverageGaps}
          valueColor={data.stats.coverageGaps > 0 ? '#E42313' : undefined}
        />
      </div>

      <HierarchyCoverageTable
        hierarchy={data.hierarchy}
        totalTeams={data.stats.totalTeams}
      />

      {toastError && (
        <ErrorToast
          message={toastError}
          onDismiss={() => setToastError(null)}
        />
      )}
    </div>
  );
};
