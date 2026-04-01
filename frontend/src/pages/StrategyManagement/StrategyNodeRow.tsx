import React from 'react';
import { Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import styles from './StrategyManagementPage.module.css';

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export interface StrategyNodeRowProps {
  name: string;
  description?: string;
  level: 'rally-cry' | 'defining-objective' | 'outcome';
  expanded?: boolean;
  selected?: boolean;
  onSelectRallyCry?: () => void;
  onToggleExpand?: () => void;
  onAddChild?: () => void;
  addChildLabel?: string;
  // Edit props
  editing?: boolean;
  editName?: string;
  editDescription?: string;
  onEditNameChange?: (value: string) => void;
  onEditDescriptionChange?: (value: string) => void;
  onStartEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  editSaving?: boolean;
  // Archive props
  archived?: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  children?: React.ReactNode;
}

export const StrategyNodeRow: React.FC<StrategyNodeRowProps> = ({
  name,
  description,
  level,
  expanded,
  selected,
  onSelectRallyCry,
  onToggleExpand,
  onAddChild,
  addChildLabel,
  editing,
  editName,
  editDescription,
  onEditNameChange,
  onEditDescriptionChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  editSaving,
  archived,
  onArchive,
  onUnarchive,
  children,
}) => {
  const rowClass = level === 'rally-cry'
    ? styles.rcRow
    : level === 'defining-objective'
      ? styles.doRow
      : styles.outcomeRow;

  const dotClass = level === 'rally-cry'
    ? styles.rcDot
    : level === 'defining-objective'
      ? styles.doDot
      : styles.outcomeDot;

  const nameClass = level === 'rally-cry'
    ? styles.rcName
    : level === 'defining-objective'
      ? styles.doName
      : styles.outcomeName;

  const descClass = level === 'rally-cry'
    ? styles.rcDescription
    : styles.doDescription;

  const archivedClass = archived ? styles.archivedRow : '';

  if (editing) {
    return (
      <>
        <div className={`${rowClass} ${archivedClass}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
            <input
              className={styles.formInput}
              type="text"
              value={editName ?? ''}
              onChange={e => onEditNameChange?.(e.target.value)}
              autoFocus
              data-testid="inline-edit-name"
            />
            <textarea
              className={styles.formTextarea}
              value={editDescription ?? ''}
              onChange={e => onEditDescriptionChange?.(e.target.value)}
            />
            <div className={styles.formActions}>
              <button className={styles.formButtonSecondary} onClick={onCancelEdit} type="button">
                Cancel
              </button>
              <button
                className={styles.formButtonPrimary}
                onClick={onSaveEdit}
                disabled={!(editName ?? '').trim() || editSaving}
                type="button"
              >
                {editSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  const rcSelected = level === 'rally-cry' && selected;
  const rowClickable = level === 'rally-cry' && onSelectRallyCry;

  return (
    <>
      <div className={`${rowClass} ${archivedClass} ${rcSelected ? styles.rcRowSelected : ''}`}>
        <div
          className={styles.rowLeft}
          onClick={rowClickable ? () => onSelectRallyCry() : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0,
            cursor: rowClickable ? 'pointer' : onToggleExpand ? 'default' : 'default',
          }}
        >
          {onToggleExpand && (
            <button
              type="button"
              className={styles.expandBtn}
              aria-expanded={!!expanded}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              onClick={e => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              <ChevronIcon expanded={!!expanded} />
            </button>
          )}
          <div className={dotClass} />
          <span className={nameClass}>{name}</span>
          {description && level !== 'outcome' && (
            <span className={descClass}>{description}</span>
          )}
        </div>
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {!archived && onStartEdit && (
            <button
              className={styles.actionBtn}
              onClick={e => { e.stopPropagation(); onStartEdit(); }}
              title="Edit"
              data-testid="edit-node-btn"
              type="button"
            >
              <Pencil size={14} />
            </button>
          )}
          {!archived && onArchive && (
            <button
              className={styles.actionBtn}
              onClick={e => { e.stopPropagation(); onArchive(); }}
              title="Archive"
              data-testid="archive-node-btn"
              type="button"
            >
              <Archive size={14} />
            </button>
          )}
          {archived && onUnarchive && (
            <button
              className={styles.actionBtn}
              onClick={e => { e.stopPropagation(); onUnarchive(); }}
              title="Unarchive"
              data-testid="unarchive-node-btn"
              type="button"
            >
              <ArchiveRestore size={14} />
            </button>
          )}
          {onAddChild && (
            <button
              className={styles.actionBtn}
              onClick={e => { e.stopPropagation(); onAddChild(); }}
              title={addChildLabel ?? 'Add'}
              data-testid={level === 'rally-cry' ? 'add-do-btn' : 'add-outcome-btn'}
              type="button"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </>
  );
};
