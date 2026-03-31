import React from 'react';
import { PlanStatus } from '../../api/types';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  planStatus: PlanStatus;
  onLock: () => void;
  onAddCommitment: () => void;
  onStartReconciliation: () => void;
  locking?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  planStatus,
  onLock,
  onAddCommitment,
  onStartReconciliation,
  locking = false,
}) => {
  return (
    <div className={styles.actionBar}>
      {planStatus === 'DRAFT' && (
        <>
          <button className={styles.buttonOutline} onClick={onLock} type="button" disabled={locking}>
            <LockIcon />
            {locking ? 'Locking...' : 'Lock Plan'}
          </button>
          <button className={styles.buttonFilled} onClick={onAddCommitment} type="button">
            <PlusIcon />
            Add Commitment
          </button>
        </>
      )}
      {planStatus === 'ACTIVE' && (
        <button className={styles.buttonFilled} onClick={onStartReconciliation} type="button">
          Begin Reconciliation
        </button>
      )}
      {(planStatus === 'RECONCILING' || planStatus === 'DONE') && (
        <span className={styles.linkButton}>View Reconciliation</span>
      )}
    </div>
  );
};

const LockIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
