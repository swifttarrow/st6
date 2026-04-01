import React from 'react';
import styles from './StatCard.module.css';

export type StatCardTone = 'default' | 'success' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Smaller context next to the main figure (e.g. percentage). */
  secondary?: string;
  valueColor?: string;
  /** Semantic color when `valueColor` is not set. */
  tone?: StatCardTone;
  /** Stronger visual treatment (accent bar, soft tint). */
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  secondary,
  valueColor,
  tone = 'default',
  highlight = false,
}) => {
  const useTone = !valueColor;

  return (
    <div
      className={`${styles.container} ${highlight ? styles.highlight : ''}`}
      data-tone={useTone ? tone : undefined}
      data-testid="stat-card"
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.figureRow}>
        <span
          className={styles.value}
          data-testid="stat-card-value"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </span>
        {secondary != null && secondary !== '' && (
          <span className={styles.secondary}>{secondary}</span>
        )}
      </div>
    </div>
  );
};
