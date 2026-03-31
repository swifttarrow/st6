import React from 'react';
import { RcdoHierarchyCoverage } from '../../api/types';
import { CoverageStatusBadge } from '../CoverageStatusBadge/CoverageStatusBadge';
import { CoverageAlert } from '../CoverageAlert/CoverageAlert';
import styles from './HierarchyCoverageTable.module.css';

interface HierarchyCoverageTableProps {
  hierarchy: RcdoHierarchyCoverage[];
  totalTeams: number;
}

export const HierarchyCoverageTable: React.FC<HierarchyCoverageTableProps> = ({
  hierarchy,
  totalTeams,
}) => {
  return (
    <div className={styles.container} data-testid="hierarchy-coverage-table">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Strategic Hierarchy Coverage</span>
        <span className={styles.headerHint}>Read-only</span>
      </div>

      <div className={styles.columnHeaders}>
        <span className={styles.colName}>Rally Cry / Defining Objective</span>
        <span className={styles.colTeams}>Teams</span>
        <span className={styles.colCommitments}>Commitments</span>
        <span className={styles.colCoverage}>Coverage</span>
        <span className={styles.colStatus}>Status</span>
      </div>

      {hierarchy.map((rc) => (
        <React.Fragment key={rc.id}>
          <div
            className={`${styles.rcRow} ${rc.status === 'ALERT' ? styles.rcRowAlert : ''}`}
            data-testid="rc-row"
          >
            <span className={styles.rcName}>{rc.name}</span>
            <span className={styles.colTeams}>{rc.teamCount}/{totalTeams}</span>
            <span className={styles.colCommitments}>{rc.commitmentCount}</span>
            <span className={styles.colCoverage}>{Math.round(rc.coveragePercent)}%</span>
            <span className={styles.colStatus}>
              <CoverageStatusBadge status={rc.status as 'ON_TRACK' | 'AT_RISK' | 'ALERT'} />
            </span>
          </div>

          {rc.consecutiveZeroWeeks != null && rc.consecutiveZeroWeeks >= 3 && (
            <CoverageAlert
              message={rc.warningNote ?? `No coverage for ${rc.consecutiveZeroWeeks} consecutive weeks`}
            />
          )}

          {rc.children?.map((doItem) => (
            <div className={styles.doRow} key={doItem.id} data-testid="do-row">
              <span className={styles.doName}>{doItem.name}</span>
              <span className={styles.colTeams}>{doItem.teamCount}/{totalTeams}</span>
              <span className={styles.colCommitments}>{doItem.commitmentCount}</span>
              <span className={styles.colCoverage}>{Math.round(doItem.coveragePercent)}%</span>
              <span className={styles.colStatus}>
                <CoverageStatusBadge status={doItem.status as 'ON_TRACK' | 'AT_RISK' | 'ALERT'} />
              </span>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
