import React from 'react';
import type { Commitment } from '../../api/types';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  commitments: Commitment[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ commitments }) => {
  const total = commitments.length;
  const completed = commitments.filter((c) => c.actualStatus === 'COMPLETED').length;
  const partial = commitments.filter((c) => c.actualStatus === 'PARTIALLY_COMPLETED').length;
  const dropped = commitments.filter((c) => c.actualStatus === 'DROPPED').length;

  return (
    <div className={styles.container} data-testid="stats-bar">
      <div className={styles.stat}>
        <span className={`${styles.count} ${styles.green}`}>{completed}/{total}</span>
        <span className={styles.label}>Completed</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={`${styles.count} ${styles.dark}`}>{partial}</span>
        <span className={styles.label}>Partial</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={`${styles.count} ${styles.red}`}>{dropped}</span>
        <span className={styles.label}>Dropped</span>
      </div>
    </div>
  );
};
