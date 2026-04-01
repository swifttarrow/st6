import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StatCard } from '../../components/StatCard/StatCard';
import type { ExecutiveOverviewResponse } from '../../api/types';
import { getMonday, getTodayDate } from '../../utils/weekDates';
import styles from './ExecutiveOverviewPage.module.css';

function formatWeekRange(dateStr: string): string {
  const monday = getMonday(dateStr);
  const [year, month, day] = monday.split('-').map(Number);
  const mon = new Date(year, month - 1, day);
  const fri = new Date(year, month - 1, day + 4);
  const monLabel = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const friLabel = fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${monLabel} \u2013 ${friLabel}, ${year}`;
}

function formatShortWeek(isoMonday: string): string {
  const [year, month, day] = isoMonday.split('-').map(Number);
  const mon = new Date(year, month - 1, day);
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ExecutiveOverviewPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();
  const [currentDate, setCurrentDate] = useState(getTodayDate);
  const [data, setData] = useState<ExecutiveOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadData = useCallback(
    async (date: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.dashboard.getExecutiveOverview(date);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load executive overview');
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    loadData(currentDate);
  }, [loadData, currentDate]);

  const handleWeekChange = useCallback((date: string) => {
    setCurrentDate(date);
  }, []);

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

  const f = data.focusWeek;
  const inFlight = f.lockedCount + f.reconcilingCount;
  const doneRatio =
    f.totalPlans > 0 ? Math.round((f.reconciledCount * 100) / f.totalPlans) : 0;
  const reconciledTone =
    f.reconciledCount === 0
      ? 'neutral'
      : doneRatio >= 50
        ? 'success'
        : 'default';
  const reconciledSecondary =
    f.totalPlans > 0
      ? `${doneRatio}% of ${f.totalPlans} plan${f.totalPlans === 1 ? '' : 's'}`
      : 'No plans this week';

  return (
    <div className={styles.page} data-testid="executive-overview">
      <PageHeader
        title="Executive rollup"
        actions={
          <WeekNavigator currentDate={currentDate} onWeekChange={handleWeekChange} />
        }
      />
      <p className={styles.subtitle}>
        Org-wide lifecycle and commitment mix \u2014 {formatWeekRange(currentDate)}
      </p>

      <div className={styles.statsRow}>
        <StatCard label="Plans (this week)" value={f.totalPlans} />
        <StatCard label="Distinct people" value={f.distinctUsers} />
        <StatCard label="Teams represented" value={f.distinctTeams} />
        <StatCard label="Org commitments" value={f.totalCommitments} />
        <StatCard
          label="Reconciled plans"
          value={f.reconciledCount}
          secondary={reconciledSecondary}
          tone={reconciledTone}
          highlight
        />
        <StatCard label="In flight (locked + reconciling)" value={inFlight} />
        <StatCard label="Still draft" value={f.draftCount} />
      </div>

      <section className={styles.section} aria-labelledby="trend-heading">
        <h2 id="trend-heading" className={styles.sectionTitle}>
          Eight-week execution trend
        </h2>
        <p className={styles.sectionHint}>
          Plan counts and total commitments per week (Monday start). Use this to spot drift in lock and reconcile behavior.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Week starting</th>
                <th scope="col">Plans</th>
                <th scope="col">Draft</th>
                <th scope="col">Locked</th>
                <th scope="col">Reconciling</th>
                <th scope="col">Reconciled</th>
                <th scope="col">Commitments</th>
              </tr>
            </thead>
            <tbody>
              {data.eightWeekTrend.map((row) => (
                <tr key={row.weekStartDate}>
                  <td>{formatShortWeek(row.weekStartDate)}</td>
                  <td>{row.totalPlans}</td>
                  <td>{row.draftCount}</td>
                  <td>{row.lockedCount}</td>
                  <td>{row.reconcilingCount}</td>
                  <td>{row.reconciledCount}</td>
                  <td>{row.totalCommitments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="mix-heading">
        <h2 id="mix-heading" className={styles.sectionTitle}>
          Rally cry commitment mix
        </h2>
        <p className={styles.sectionHint}>
          Share of this week&apos;s org commitments mapped to each active rally cry (sorted by volume).
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Rally cry</th>
                <th scope="col">Commitments</th>
                <th scope="col">Share of org</th>
                <th scope="col" className={styles.barCell}>
                  Visual
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rallyCryCommitmentMix.map((row) => (
                <tr key={row.rallyCryId}>
                  <td>{row.rallyCryName}</td>
                  <td>{row.commitmentCount}</td>
                  <td>{row.percentOfOrgCommitments}%</td>
                  <td className={styles.barCell}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${Math.min(100, row.percentOfOrgCommitments)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className={styles.linkRow}>
        <Link to="/leadership">Open hierarchy coverage view</Link>
        {' '}for the same strategic tree with team coverage detail.
      </p>
    </div>
  );
};
