import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { StatCard } from '../../components/StatCard/StatCard';
import type { MyPlanSummary, PlanStatus } from '../../api/types';
import { addWeeks, formatWeekSpan, getMonday, getTodayDate } from '../../utils/weekDates';
import styles from './HistoryPage.module.css';

function formatShortWeek(weekStartDate: string): string {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusLabel(status: PlanStatus): string {
  switch (status) {
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

function statusTone(status: PlanStatus): 'default' | 'success' | 'neutral' {
  if (status === 'RECONCILED') return 'success';
  if (status === 'DRAFT') return 'neutral';
  return 'default';
}

function changeLabel(current: number, previous: number | null): string {
  if (previous == null) return 'First saved week';
  const delta = current - previous;
  if (delta === 0) return 'No change from prior week';
  if (delta > 0) return `+${delta} vs prior saved week`;
  return `${delta} vs prior saved week`;
}

export const HistoryPage: React.FC = () => {
  const api = useApi();
  const [history, setHistory] = useState<MyPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonday = useMemo(() => getMonday(getTodayDate()), []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await api.plans.listMyPlans(addWeeks(currentMonday, -52), currentMonday);
      setHistory(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [api, currentMonday]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const historyAsc = useMemo(
    () => [...history].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate)),
    [history],
  );

  const recentWeeks = useMemo(() => historyAsc.slice(-16), [historyAsc]);

  const totalCommitments = useMemo(
    () => history.reduce((sum, row) => sum + row.commitmentCount, 0),
    [history],
  );

  const reconciledWeeks = useMemo(
    () => history.filter((row) => row.status === 'RECONCILED').length,
    [history],
  );

  const openWeeks = useMemo(
    () => history.filter((row) => row.status !== 'RECONCILED'),
    [history],
  );

  const pastOpenWeeks = useMemo(
    () =>
      history.filter(
        (row) => row.status !== 'RECONCILED' && row.weekStartDate < currentMonday,
      ),
    [currentMonday, history],
  );

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (const row of history) {
      if (row.status !== 'RECONCILED') break;
      streak += 1;
    }
    return streak;
  }, [history]);

  const maxCommitments = useMemo(
    () => Math.max(1, ...recentWeeks.map((row) => row.commitmentCount)),
    [recentWeeks],
  );

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page} data-testid="history-page">
      <PageHeader
        title="History"
        actions={
          <div className={styles.headerActions}>
            <Link to={`/commitments?week=${encodeURIComponent(currentMonday)}`} className={styles.headerLink}>
              Open current week
            </Link>
          </div>
        }
      />
      <p className={styles.subtitle}>
        Long-view patterns across your last 52 saved weeks. Use this to spot unfinished weeks, rising load, and planning consistency.
      </p>

      <div className={styles.statsRow}>
        <StatCard label="Weeks with plans" value={history.length} />
        <StatCard
          label="Reconciled weeks"
          value={reconciledWeeks}
          secondary={history.length > 0 ? `${Math.round((reconciledWeeks * 100) / history.length)}%` : '0%'}
          tone={reconciledWeeks > 0 ? 'success' : 'neutral'}
          highlight={reconciledWeeks > 0}
        />
        <StatCard
          label="Weeks still open"
          value={openWeeks.length}
          secondary={pastOpenWeeks.length > 0 ? `${pastOpenWeeks.length} older week${pastOpenWeeks.length === 1 ? '' : 's'}` : 'Nothing overdue'}
          valueColor={pastOpenWeeks.length > 0 ? '#E42313' : undefined}
          tone={pastOpenWeeks.length > 0 ? 'default' : 'neutral'}
        />
        <StatCard
          label="Avg commitments"
          value={history.length > 0 ? (totalCommitments / history.length).toFixed(1) : '\u2014'}
          secondary={currentStreak > 0 ? `${currentStreak} week reconciled streak` : 'No active streak'}
          tone={currentStreak > 0 ? 'success' : 'neutral'}
        />
      </div>

      {pastOpenWeeks.length > 0 && (
        <section className={styles.attentionSection} aria-labelledby="history-attention-heading">
          <div className={styles.sectionHeader}>
            <h2 id="history-attention-heading" className={styles.sectionTitle}>
              Needs attention
            </h2>
            <p className={styles.sectionHint}>
              Older weeks below are still open, which usually means carry-forward and reconciliation signals are incomplete.
            </p>
          </div>
          <div className={styles.attentionList}>
            {pastOpenWeeks.slice(0, 4).map((row) => (
              <div className={styles.attentionCard} key={row.id}>
                <div>
                  <p className={styles.attentionWeek}>{formatWeekSpan(row.weekStartDate)}</p>
                  <p className={styles.attentionMeta}>
                    {statusLabel(row.status)} · {row.commitmentCount} commitment{row.commitmentCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className={styles.attentionActions}>
                  <Link to={`/commitments?week=${encodeURIComponent(row.weekStartDate)}`} className={styles.secondaryLink}>
                    Open
                  </Link>
                  {(row.status === 'LOCKED' || row.status === 'RECONCILING' || row.status === 'RECONCILED') && (
                    <Link to={`/reconciliation?week=${encodeURIComponent(row.weekStartDate)}`} className={styles.primaryLink}>
                      Reconcile
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="history-trend-heading">
        <div className={styles.sectionHeader}>
          <h2 id="history-trend-heading" className={styles.sectionTitle}>
            Commitment volume trend
          </h2>
          <p className={styles.sectionHint}>
            Last 16 saved weeks, colored by lifecycle status. Taller bars mean more commitments.
          </p>
        </div>

        {recentWeeks.length === 0 ? (
          <p className={styles.emptyState}>No saved weeks yet.</p>
        ) : (
          <>
            <div className={styles.legend} aria-label="Trend legend">
              <span className={`${styles.legendItem} ${styles.legendReconciled}`}>Reconciled</span>
              <span className={`${styles.legendItem} ${styles.legendReconciling}`}>Reconciling</span>
              <span className={`${styles.legendItem} ${styles.legendLocked}`}>Locked</span>
              <span className={`${styles.legendItem} ${styles.legendDraft}`}>Draft</span>
            </div>
            <div className={styles.trendGrid} data-testid="history-trend-grid">
              {recentWeeks.map((row, index) => {
                const previous = index > 0 ? recentWeeks[index - 1] : null;
                const barHeight = row.commitmentCount === 0
                  ? 10
                  : Math.max(16, Math.round((row.commitmentCount / maxCommitments) * 100));
                return (
                  <Link
                    key={row.id}
                    to={`/commitments?week=${encodeURIComponent(row.weekStartDate)}`}
                    className={styles.trendColumn}
                    data-status={row.status}
                    data-current={row.weekStartDate === currentMonday ? 'true' : undefined}
                    aria-label={`${formatWeekSpan(row.weekStartDate)}: ${row.commitmentCount} commitments, ${statusLabel(row.status)}`}
                    title={`${formatWeekSpan(row.weekStartDate)} · ${statusLabel(row.status)} · ${row.commitmentCount} commitments · ${changeLabel(row.commitmentCount, previous?.commitmentCount ?? null)}`}
                  >
                    <span className={styles.trendValue}>{row.commitmentCount}</span>
                    <span className={styles.trendBarTrack}>
                      <span className={styles.trendBar} style={{ height: `${barHeight}%` }} />
                    </span>
                    <span className={styles.trendWeek}>{formatShortWeek(row.weekStartDate)}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className={styles.section} aria-labelledby="history-table-heading">
        <div className={styles.sectionHeader}>
          <h2 id="history-table-heading" className={styles.sectionTitle}>
            Week-by-week log
          </h2>
          <p className={styles.sectionHint}>
            Detailed view of every saved week, newest first.
          </p>
        </div>

        {history.length === 0 ? (
          <p className={styles.emptyState}>No saved weeks in this range yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Status</th>
                  <th scope="col">Commitments</th>
                  <th scope="col">Trend</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => {
                  const previous = history[index + 1];
                  const canReconcile =
                    row.status === 'LOCKED' || row.status === 'RECONCILING' || row.status === 'RECONCILED';
                  return (
                    <tr key={row.id} data-status={row.status}>
                      <td>{formatWeekSpan(row.weekStartDate)}</td>
                      <td>
                        <span className={styles.statusPill} data-tone={statusTone(row.status)}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td>{row.commitmentCount}</td>
                      <td>{changeLabel(row.commitmentCount, previous?.commitmentCount ?? null)}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link to={`/commitments?week=${encodeURIComponent(row.weekStartDate)}`} className={styles.secondaryLink}>
                            Open
                          </Link>
                          {canReconcile && (
                            <Link to={`/reconciliation?week=${encodeURIComponent(row.weekStartDate)}`} className={styles.primaryLink}>
                              Reconcile
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
