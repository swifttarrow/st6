import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './ErrorToast.module.css';

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.toast} data-testid="error-toast" role="alert">
      <AlertCircle size={16} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      <button
        className={styles.dismissButton}
        onClick={onDismiss}
        type="button"
        aria-label="Dismiss error"
      >
        <X size={14} />
      </button>
    </div>
  );
};
