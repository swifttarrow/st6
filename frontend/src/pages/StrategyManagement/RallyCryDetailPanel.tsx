import React, { useEffect, useState } from 'react';
import { RcdoTreeRallyCry } from '../../api/types';
import styles from './RallyCryDetailPanel.module.css';

export interface RallyCryDetailPanelProps {
  rallyCry: RcdoTreeRallyCry | null;
  saving: boolean;
  archiving: boolean;
  onSave: (name: string, description: string) => void;
  onArchive: () => void;
}

export const RallyCryDetailPanel: React.FC<RallyCryDetailPanelProps> = ({
  rallyCry,
  saving,
  archiving,
  onSave,
  onArchive,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (rallyCry) {
      setName(rallyCry.name);
      setDescription(rallyCry.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [rallyCry]);

  if (!rallyCry) {
    return (
      <aside className={styles.panel} data-testid="rally-cry-detail-panel">
        <div className={styles.empty}>Select a Rally Cry to view details.</div>
      </aside>
    );
  }

  const totalOutcomes = rallyCry.definingObjectives.reduce(
    (n, d) => n + d.outcomes.length,
    0,
  );
  const isArchived = !!rallyCry.archived;

  return (
    <aside className={styles.panel} data-testid="rally-cry-detail-panel">
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Rally Cry Details</h2>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{rallyCry.name}</span>
          <span
            className={
              isArchived ? `${styles.statusBadge} ${styles.statusArchived}` : `${styles.statusBadge} ${styles.statusActive}`
            }
          >
            {isArchived ? 'Archived' : 'Active'}
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="rc-detail-name">
              Name
            </label>
            <input
              id="rc-detail-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isArchived}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="rc-detail-desc">
              Description
            </label>
            <textarea
              id="rc-detail-desc"
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isArchived}
              rows={4}
            />
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Defining Objectives</span>
              <span className={styles.metaValue}>{rallyCry.definingObjectives.length}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Outcomes</span>
              <span className={styles.metaValue}>{totalOutcomes}</span>
            </div>
          </div>

          {!isArchived && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.saveBtn}
                disabled={!name.trim() || saving}
                onClick={() => onSave(name.trim(), description)}
                data-testid="rc-detail-save"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className={styles.archiveBtn}
                disabled={archiving}
                onClick={onArchive}
                data-testid="rc-detail-archive"
              >
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.linkedSection}>
        <div className={styles.linkedHeader}>Linked Defining Objectives</div>
        <div className={styles.linkedColHeaders}>
          <span>Objective</span>
          <span className={styles.colRight}>Outcomes</span>
          <span className={styles.colRight}>Status</span>
        </div>
        <ul className={styles.linkedList}>
          {rallyCry.definingObjectives.map(d => (
            <li key={d.id} className={styles.linkedRow}>
              <span className={styles.linkedName}>{d.name}</span>
              <span className={styles.colRight}>{d.outcomes.length}</span>
              <span className={styles.colRight}>
                <span className={d.archived ? styles.miniArchived : styles.miniActive}>
                  {d.archived ? 'Archived' : 'Active'}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {rallyCry.definingObjectives.length === 0 && (
          <p className={styles.linkedEmpty}>No defining objectives yet.</p>
        )}
      </div>
    </aside>
  );
};
