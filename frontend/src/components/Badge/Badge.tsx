import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'active' | 'success' | 'alert';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {label}
    </span>
  );
};
