import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Commitment, PlanStatus, RcdoTreeRallyCry } from '../../api/types';
import { ArchivedOutcomeWarning } from '../ArchivedOutcomeWarning/ArchivedOutcomeWarning';
import styles from './CommitmentRow.module.css';

interface CommitmentRowProps {
  commitment: Commitment;
  rank: number;
  planStatus: PlanStatus;
  tree: RcdoTreeRallyCry[];
  onEdit: (commitment: Commitment) => void;
  onDelete: (commitmentId: string) => void;
  onRelink?: (commitmentId: string) => void;
}

function getOutcomePath(tree: RcdoTreeRallyCry[], outcomeId: string): string {
  for (const rc of tree) {
    for (const d of rc.definingObjectives) {
      for (const o of d.outcomes) {
        if (o.id === outcomeId) {
          return `${rc.name} > ${d.name} > ${o.name}`;
        }
      }
    }
  }
  return '';
}

function getOutcomeName(tree: RcdoTreeRallyCry[], outcomeId: string): string {
  for (const rc of tree) {
    for (const d of rc.definingObjectives) {
      for (const o of d.outcomes) {
        if (o.id === outcomeId) {
          return o.name;
        }
      }
    }
  }
  return 'Unknown outcome';
}

export const CommitmentRow: React.FC<CommitmentRowProps> = ({
  commitment,
  rank,
  planStatus,
  tree,
  onEdit,
  onDelete,
  onRelink,
}) => {
  const isDraft = planStatus === 'DRAFT';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: commitment.id, disabled: !isDraft });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const outcomePath = getOutcomePath(tree, commitment.outcomeId);
  const outcomePathClassName = commitment.outcomeArchived
    ? `${styles.outcomePath} ${styles.outcomePathArchived}`
    : styles.outcomePath;

  return (
    <>
      <div ref={setNodeRef} style={style} className={styles.row}>
        <div className={styles.rank}>
          {isDraft && (
            <button className={styles.dragHandle} {...attributes} {...listeners} type="button" aria-label="Drag to reorder">
              <GripIcon />
            </button>
          )}
          {!isDraft && <span>{rank}</span>}
        </div>
        <div className={styles.descriptionCell}>
          <span className={styles.description}>
            {commitment.description}
            {commitment.carriedForward && (
              <span className={styles.carriedForwardPill} data-testid="carried-forward-pill">Carried forward</span>
            )}
          </span>
        </div>
        <div className={outcomePathClassName} title={outcomePath}>{outcomePath}</div>
        <div className={styles.actions}>
          {isDraft && (
            <>
              <button
                className={styles.iconButton}
                onClick={() => onEdit(commitment)}
                type="button"
                aria-label="Edit commitment"
              >
                <EditIcon />
              </button>
              <button
                className={`${styles.iconButton} ${styles.deleteButton}`}
                onClick={() => onDelete(commitment.id)}
                type="button"
                aria-label="Delete commitment"
              >
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </div>
      {commitment.outcomeArchived && onRelink && (
        <ArchivedOutcomeWarning
          commitmentId={commitment.id}
          outcomeName={getOutcomeName(tree, commitment.outcomeId)}
          onRelink={onRelink}
        />
      )}
    </>
  );
};

const GripIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
