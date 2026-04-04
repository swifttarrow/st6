import React from 'react';
import { Info } from 'lucide-react';
import styles from './CoveragePanel.module.css';

export interface CoveragePanelItem {
  id: string;
  label: string;
  /** Optional context line (e.g. parent rally cry for a defining objective). */
  subtitle?: string;
  commitmentCount: number;
  memberCount: number;
  consecutiveZeroWeeks: number;
}

interface CoveragePanelProps {
  title: string;
  items: CoveragePanelItem[];
  /** Prefix for data-testid on each row (default `coverage-item`). */
  itemTestIdPrefix?: string;
  /** Root `data-testid` for this panel (default `coverage-panel`). */
  testId?: string;
}

export const CoveragePanel: React.FC<CoveragePanelProps> = ({
  title,
  items,
  itemTestIdPrefix = 'coverage-item',
  testId = 'coverage-panel',
}) => {
  return (
    <div className={styles.container} data-testid={testId}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{title}</span>
      </div>
      <div className={styles.list}>
        {items.map((item) => {
          const isZero = item.commitmentCount === 0;
          const showWarning = isZero && item.consecutiveZeroWeeks >= 3;

          return (
            <div
              key={item.id}
              className={`${styles.item} ${isZero ? styles.itemZero : ''}`}
              data-testid={`${itemTestIdPrefix}-${item.id}`}
            >
              <div className={styles.itemMain}>
                <div className={styles.labelBlock}>
                  <span className={`${styles.itemLabel} ${isZero ? styles.itemLabelZero : ''}`}>
                    {item.label}
                  </span>
                  {item.subtitle ? (
                    <span className={styles.itemSubtitle}>{item.subtitle}</span>
                  ) : null}
                </div>
                <span className={`${styles.badge} ${isZero ? styles.badgeZero : styles.badgeNormal}`}>
                  {item.commitmentCount} commit{item.commitmentCount !== 1 ? 's' : ''}
                </span>
              </div>
              {showWarning && (
                <div className={styles.warning} data-testid={`coverage-warning-${item.id}`}>
                  <Info size={14} className={styles.warningIcon} />
                  <span>No coverage - {item.consecutiveZeroWeeks} week running</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
