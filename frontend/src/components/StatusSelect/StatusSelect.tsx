import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ActualStatus } from '../../api/types';
import styles from './StatusSelect.module.css';

interface StatusOption {
  value: ActualStatus;
  label: string;
  styleClass: string;
  dotClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'COMPLETED', label: 'Completed', styleClass: styles.completed, dotClass: styles.completedDot },
  { value: 'PARTIALLY_COMPLETED', label: 'Partially Completed', styleClass: styles.partial, dotClass: styles.partialDot },
  { value: 'NOT_STARTED', label: 'Not Started', styleClass: styles.notStarted, dotClass: styles.notStartedDot },
  { value: 'DROPPED', label: 'Dropped', styleClass: styles.dropped, dotClass: styles.droppedDot },
];

interface StatusSelectProps {
  value: ActualStatus | null;
  onChange: (status: ActualStatus) => void;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 0 });

  const updateMenuPosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuBox({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 170),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || disabled) return;
    updateMenuPosition();
  }, [open, disabled, updateMenuPosition]);

  useEffect(() => {
    if (!open || disabled) return;
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, disabled, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
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
      {open &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.dropdown}
            role="listbox"
            style={{
              position: 'fixed',
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
};
