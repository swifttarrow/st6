import React from 'react';
import { Badge, BadgeVariant } from '../Badge/Badge';
import styles from './PageHeader.module.css';

interface PageHeaderBadge {
  label: string;
  variant: BadgeVariant;
}

interface PageHeaderProps {
  title: string;
  badge?: PageHeaderBadge;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, badge, actions }) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {badge && <Badge label={badge.label} variant={badge.variant} />}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
};
