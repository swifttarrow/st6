import React from 'react';
import { Info } from 'lucide-react';
import styles from './CoverageAlert.module.css';

interface CoverageAlertProps {
  message: string;
}

export const CoverageAlert: React.FC<CoverageAlertProps> = ({ message }) => {
  return (
    <div className={styles.row} data-testid="coverage-alert">
      <Info size={14} color="#E42313" />
      <span className={styles.message}>{message}</span>
    </div>
  );
};
