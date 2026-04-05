import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge/Badge';
import { ActionBar } from '../../components/ActionBar/ActionBar';
import { WeekNavigator } from '../../components/WeekNavigator/WeekNavigator';
import { StrategyBrowser } from '../../components/StrategyBrowser/StrategyBrowser';
import { CommitmentList } from '../../components/CommitmentList/CommitmentList';
import { CommitmentForm } from '../../components/CommitmentForm/CommitmentForm';
import { CarryForwardBanner } from '../../components/CarryForwardBanner/CarryForwardBanner';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import { PlanStatus } from '../../api/types';
import type { BadgeVariant } from '../../components/Badge/Badge';
import { formatWeekSpan } from '../../utils/weekDates';
import { useWeeklyPlanningModel } from './useWeeklyPlanningModel';
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

function reconciliationPath(weekStartDate: string): string {
  return `/reconciliation?week=${encodeURIComponent(weekStartDate)}`;
}

export const WeeklyPlanningPage: React.FC = () => {
  const {
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
  } = useWeeklyPlanningModel();

  const pageTitle = useMemo(() => {
    const dateLabel = plan ? formatWeekDate(plan.weekStartDate) : '';
    if (!plan) return 'Commitments';
    if (readOnly) {
      return `Commitments \u2014 ${plan.userId} \u2014 ${dateLabel}`;
    }
    return `Commitments \u2014 ${dateLabel}`;
  }, [plan, readOnly]);

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
  const showPriorWeekBanner = priorWeekAttention !== null;
  const treeIsEmpty = tree.length === 0;
  const showHistoryBlock = !planIdParam && !readOnly;
  const emptyStateTitle = isDraft ? 'No commitments yet' : 'No commitments this week';
  const emptyStateDescription = readOnly
    ? 'This plan has no commitments for this week.'
    : isDraft
      ? 'Add your first commitment to start planning this week, or lock an empty week if you intentionally have nothing to commit.'
      : plan.status === 'LOCKED'
        ? 'No commitments were added for this week. Start reconciliation to close out the empty week.'
        : plan.status === 'RECONCILING'
          ? 'No commitments were added for this week. Continue reconciliation to close out the empty week.'
          : 'This week was completed without any commitments.';
  const emptyStateAction = readOnly
    ? undefined
    : isDraft
      ? { label: 'Add First Commitment', onClick: handleAddCommitment }
      : plan.status === 'LOCKED'
        ? { label: 'Start Reconciliation', onClick: handleStartReconciliation }
        : plan.status === 'RECONCILING'
          ? { label: 'Continue Reconciliation', onClick: handleViewReconciliation }
          : { label: 'View Reconciliation', onClick: handleViewReconciliation };

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
                onChange={(event) => {
                  const nextValue = event.target.value;
                  handlePersonSelect(nextValue === '' ? null : nextValue);
                }}
              >
                <option value="">Me</option>
                {teamPickerMembers
                  .filter(member => member.planId)
                  .map(member => (
                    <option key={member.userId} value={member.planId!}>
                      {member.userId}
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
                onViewReconciliation={handleViewReconciliation}
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
          {isDraft ? (
            readOnly ? (
              <>
                This week has ended for {plan.userId}. They need to lock their week before they can
                reconcile.
              </>
            ) : (
              <>
                This week has ended. Lock your week using <strong>Lock Plan</strong> in the header
                to reconcile.
              </>
            )
          ) : readOnly ? (
            <>
              {plan.userId}&apos;s week has ended.
              {plan.status === 'RECONCILED'
                ? ' This week is reconciled.'
                : ' They can complete reconciliation from their account.'}
            </>
          ) : (
            <>
              This week has ended. Visit reconciliation to review your commitments.{' '}
              <Link
                to={reconciliationPath(plan.weekStartDate)}
                className={styles.staleLink}
              >
                Go to Reconciliation
              </Link>
            </>
          )}
        </div>
      )}

      {showPriorWeekBanner && priorWeekAttention && (
        <div className={styles.priorWeekBanner} data-testid="prior-week-reconcile-banner">
          {readOnly ? (
            <>
              {plan.userId}&apos;s prior week ({formatWeekDate(priorWeekAttention.weekStartDate)}) is still{' '}
              <strong>{statusLabel(priorWeekAttention.status)}</strong>. Carry-forward into this week will
              stay incomplete until they finish reconciliation.
            </>
          ) : (
            <>
              Your prior week ({formatWeekDate(priorWeekAttention.weekStartDate)}) is still{' '}
              <strong>{statusLabel(priorWeekAttention.status)}</strong>. Carry-forward into this week
              cannot finish until that plan is reconciled.{' '}
              <Link
                to={reconciliationPath(priorWeekAttention.weekStartDate)}
                className={styles.priorWeekLink}
              >
                Reconcile prior week
              </Link>
            </>
          )}
        </div>
      )}

      {showCarryForwardBanner && (
        <CarryForwardBanner
          carriedForwardCount={carriedForwardCount}
          onDismiss={dismissCarryForwardBanner}
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
                title={emptyStateTitle}
                description={emptyStateDescription}
                action={emptyStateAction}
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
          <div className={styles.historyHeader}>
            <div>
              <h2 id="plan-history-heading" className={styles.historyTitle}>
                Your plan history
              </h2>
              <p className={styles.historyHint}>
                Weeks where you already have a plan (last 52 weeks). Click a row to open commitments, or jump straight to reconciliation.
              </p>
            </div>
            <Link to="/history" className={styles.historyRouteLink}>
              Open full history
            </Link>
          </div>
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
                      className={`${styles.historyRow} ${isCurrent ? styles.historyRowCurrent : ''}`}
                      tabIndex={0}
                      onClick={() => openCommitmentsWeek(row.weekStartDate)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openCommitmentsWeek(row.weekStartDate);
                        }
                      }}
                      data-testid={`history-row-${row.weekStartDate}`}
                    >
                      <td>{formatWeekSpan(row.weekStartDate)}</td>
                      <td>{statusLabel(row.status)}</td>
                      <td>{row.commitmentCount}</td>
                      <td>
                        <div className={styles.historyActions}>
                          {canReconcile && (
                            <Link
                              className={styles.historyLink}
                              to={reconciliationPath(row.weekStartDate)}
                              aria-label={`Reconcile week ${formatWeekSpan(row.weekStartDate)}`}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
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
          )}
        </section>
      )}

      {showForm && !readOnly && (
        <CommitmentForm
          mode={editingCommitment ? 'edit' : 'create'}
          commitment={editingCommitment ?? undefined}
          tree={tree}
          searchOutcomes={searchOutcomes}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {toastError && (
        <ErrorToast
          message={toastError}
          onDismiss={dismissToastError}
        />
      )}
    </div>
  );
};
