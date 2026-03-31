import React from 'react';
import styles from './CoverageStatusBadge.module.css';

interface CoverageStatusBadgeProps {
  status: 'ON_TRACK' | 'AT_RISK' | 'ALERT';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ON_TRACK: { label: 'On Track', className: 'onTrack' },
  AT_RISK: { label: 'At Risk', className: 'atRisk' },
  ALERT: { label: 'Alert', className: 'alert' },
};

export const CoverageStatusBadge: React.FC<CoverageStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ON_TRACK;
  return (
    <span
      className={`${styles.badge} ${styles[config.className]}`}
      data-testid="coverage-status-badge"
    >
      {config.label}
    </span>
  );
};
