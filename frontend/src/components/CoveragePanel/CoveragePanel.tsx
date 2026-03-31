import React from 'react';
import { Info } from 'lucide-react';
import { RallyCryCoverage } from '../../api/types';
import styles from './CoveragePanel.module.css';

interface CoveragePanelProps {
  coverage: RallyCryCoverage[];
}

export const CoveragePanel: React.FC<CoveragePanelProps> = ({ coverage }) => {
  return (
    <div className={styles.container} data-testid="coverage-panel">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Rally Cry Coverage</span>
      </div>
      <div className={styles.list}>
        {coverage.map((rc) => {
          const isZero = rc.commitmentCount === 0;
          const showWarning = isZero && rc.consecutiveZeroWeeks >= 3;

          return (
            <div
              key={rc.rallyCryId}
              className={`${styles.item} ${isZero ? styles.itemZero : ''}`}
              data-testid={`coverage-item-${rc.rallyCryId}`}
            >
              <div className={styles.itemMain}>
                <span className={`${styles.rcName} ${isZero ? styles.rcNameZero : ''}`}>
                  {rc.rallyCryName}
                </span>
                <span className={`${styles.badge} ${isZero ? styles.badgeZero : styles.badgeNormal}`}>
                  {rc.commitmentCount} commit{rc.commitmentCount !== 1 ? 's' : ''}
                </span>
              </div>
              {showWarning && (
                <div className={styles.warning} data-testid={`coverage-warning-${rc.rallyCryId}`}>
                  <Info size={14} className={styles.warningIcon} />
                  <span>No coverage - {rc.consecutiveZeroWeeks} week running</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
