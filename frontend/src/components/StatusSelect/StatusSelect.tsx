import React, { useState, useRef, useEffect } from 'react';
import type { ActualStatus } from '../../api/types';
import styles from './StatusSelect.module.css';

interface StatusOption {
  value: ActualStatus;
  label: string;
  styleClass: string;
  dotClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'DONE', label: 'Completed', styleClass: styles.completed, dotClass: styles.completedDot },
  { value: 'PARTIAL', label: 'Partially Completed', styleClass: styles.partial, dotClass: styles.partialDot },
  { value: 'PENDING', label: 'Not Started', styleClass: styles.notStarted, dotClass: styles.notStartedDot },
  { value: 'MISSED', label: 'Dropped', styleClass: styles.dropped, dotClass: styles.droppedDot },
];

interface StatusSelectProps {
  value: ActualStatus | null;
  onChange: (status: ActualStatus) => void;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = value ? STATUS_OPTIONS.find((o) => o.value === value) : null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${selected ? selected.styleClass : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        data-testid="status-select"
      >
        {selected ? (
          <>
            <span className={`${styles.dot} ${selected.dotClass}`} />
            {selected.label}
          </>
        ) : (
          <span className={styles.placeholder}>Select status</span>
        )}
        {!disabled && (
          <svg className={styles.chevron} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5l3 3 3-3" />
          </svg>
        )}
      </button>
      {open && !disabled && (
        <div className={styles.dropdown} role="listbox">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${opt.styleClass}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={value === opt.value}
            >
              <span className={`${styles.dot} ${opt.dotClass}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
