import React from 'react';
import { Info, X } from 'lucide-react';
import styles from './CarryForwardBanner.module.css';

interface CarryForwardBannerProps {
  carriedForwardCount: number;
  onDismiss: () => void;
}

export const CarryForwardBanner: React.FC<CarryForwardBannerProps> = ({
  carriedForwardCount,
  onDismiss,
}) => {
  if (carriedForwardCount <= 0) return null;

  return (
    <div className={styles.banner} data-testid="carry-forward-banner">
      <Info size={16} className={styles.icon} />
      <span className={styles.message}>
        {carriedForwardCount} commitment(s) carried forward from last week. Review and adjust as needed.
      </span>
      <button
        className={styles.dismissButton}
        onClick={onDismiss}
        type="button"
        aria-label="Dismiss banner"
        data-testid="dismiss-banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};
