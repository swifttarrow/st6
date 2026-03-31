import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, valueColor }) => {
  return (
    <div className={styles.container} data-testid="stat-card">
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
};
