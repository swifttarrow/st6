import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ArchivedOutcomeWarning.module.css';

interface ArchivedOutcomeWarningProps {
  commitmentId: string;
  outcomeName: string;
  onRelink: (commitmentId: string) => void;
}

export const ArchivedOutcomeWarning: React.FC<ArchivedOutcomeWarningProps> = ({
  commitmentId,
  outcomeName,
  onRelink,
}) => {
  return (
    <div className={styles.warning} data-testid="archived-outcome-warning">
      <AlertTriangle size={14} className={styles.icon} />
      <span className={styles.message}>
        This outcome has been archived. Please link to an active outcome before locking.
      </span>
      <button
        className={styles.relinkButton}
        onClick={() => onRelink(commitmentId)}
        type="button"
        data-testid="relink-button"
      >
        Re-link
      </button>
    </div>
  );
};
