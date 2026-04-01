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
import styles from './LeadershipViewPage.module.css';

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
