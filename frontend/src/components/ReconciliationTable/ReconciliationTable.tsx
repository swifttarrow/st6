import React, { useState } from 'react';
import type { Commitment, ActualStatus, PlanStatus, RcdoTreeRallyCry } from '../../api/types';
import { StatusSelect } from '../StatusSelect/StatusSelect';
import styles from './ReconciliationTable.module.css';

interface ReconciliationTableProps {
  commitments: Commitment[];
  planStatus: PlanStatus;
  tree: RcdoTreeRallyCry[];
  onReconcile: (commitmentId: string, actualStatus: ActualStatus, notes: string) => void;
  notes: Record<string, string>;
  onNotesChange: (commitmentId: string, notes: string) => void;
}

function buildOutcomePath(outcomeId: string, tree: RcdoTreeRallyCry[]): string {
  for (const rc of tree) {
    for (const dObj of rc.definingObjectives) {
      for (const outcome of dObj.outcomes) {
        if (outcome.id === outcomeId) {
          return `${rc.title} > ${dObj.title} > ${outcome.title}`;
        }
      }
    }
  }
  return '';
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  commitments,
  planStatus,
  tree,
  onReconcile,
  notes,
  onNotesChange,
}) => {
  const isReadOnly = planStatus === 'DONE';
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const handleStatusChange = (commitmentId: string, status: ActualStatus) => {
    const currentNotes = notes[commitmentId] || '';
    onReconcile(commitmentId, status, currentNotes);
  };

  const handleNotesBlur = (commitmentId: string, value: string) => {
    onNotesChange(commitmentId, value);
    const c = commitments.find((cm) => cm.id === commitmentId);
    if (c) {
      onReconcile(commitmentId, c.actualStatus, value);
    }
  };

  if (commitments.length === 0) {
    return <div className={styles.emptyState}>No commitments to reconcile.</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow}>
          <th className={styles.colRank}>#</th>
          <th className={styles.colCommitment}>Commitment</th>
          <th className={styles.colOutcome}>Linked Outcome</th>
          <th className={styles.colPlanned}>Planned</th>
          <th className={styles.colStatus}>Actual Status</th>
          <th className={styles.colNotes}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {commitments.map((commitment, index) => {
          const outcomePath = buildOutcomePath(commitment.outcomeId, tree);
          const noteValue = localNotes[commitment.id] !== undefined
            ? localNotes[commitment.id]
            : (notes[commitment.id] || '');

          return (
            <tr key={commitment.id} className={styles.row}>
              <td><span className={styles.rank}>{index + 1}</span></td>
              <td><span className={styles.description}>{commitment.title}</span></td>
              <td><span className={styles.outcomePath}>{outcomePath || '-'}</span></td>
              <td><span className={styles.planned}>Planned</span></td>
              <td>
                <StatusSelect
                  value={commitment.actualStatus === 'PENDING' ? null : commitment.actualStatus}
                  onChange={(status) => handleStatusChange(commitment.id, status)}
                  disabled={isReadOnly}
                />
              </td>
              <td>
                {isReadOnly ? (
                  <span className={styles.notesText}>{notes[commitment.id] || '-'}</span>
                ) : (
                  <input
                    type="text"
                    className={styles.notesInput}
                    placeholder="Add notes..."
                    value={noteValue}
                    onChange={(e) => {
                      setLocalNotes((prev) => ({ ...prev, [commitment.id]: e.target.value }));
                    }}
                    onBlur={(e) => {
                      setLocalNotes((prev) => {
                        const next = { ...prev };
                        delete next[commitment.id];
                        return next;
                      });
                      handleNotesBlur(commitment.id, e.target.value);
                    }}
                    data-testid={`notes-${commitment.id}`}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
