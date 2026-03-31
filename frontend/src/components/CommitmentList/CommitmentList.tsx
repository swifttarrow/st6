import React, { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Commitment, PlanStatus, RcdoTreeRallyCry } from '../../api/types';
import { CommitmentRow } from '../CommitmentRow/CommitmentRow';
import styles from './CommitmentList.module.css';

interface CommitmentListProps {
  commitments: Commitment[];
  planStatus: PlanStatus;
  tree: RcdoTreeRallyCry[];
  onEdit: (commitment: Commitment) => void;
  onDelete: (commitmentId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onRelink?: (commitmentId: string) => void;
}

export const CommitmentList: React.FC<CommitmentListProps> = ({
  commitments,
  planStatus,
  tree,
  onEdit,
  onDelete,
  onReorder,
  onRelink,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = commitments.findIndex(c => c.id === active.id);
      const newIndex = commitments.findIndex(c => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...commitments];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      onReorder(reordered.map(c => c.id));
    },
    [commitments, onReorder],
  );

  const isDraft = planStatus === 'DRAFT';

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.headerCell}>#</span>
        <span className={styles.headerCell}>Commitment</span>
        <span className={styles.headerCell}>Linked Outcome</span>
        <span className={`${styles.headerCell} ${styles.headerCellRight}`}>Actions</span>
      </div>
      {commitments.length === 0 && (
        <div className={styles.emptyState}>
          No commitments yet. Add one to get started.
        </div>
      )}
      {isDraft ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={commitments.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {commitments.map((c, i) => (
              <CommitmentRow
                key={c.id}
                commitment={c}
                rank={i + 1}
                planStatus={planStatus}
                tree={tree}
                onEdit={onEdit}
                onDelete={onDelete}
                onRelink={onRelink}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        commitments.map((c, i) => (
          <CommitmentRow
            key={c.id}
            commitment={c}
            rank={i + 1}
            planStatus={planStatus}
            tree={tree}
            onEdit={onEdit}
            onDelete={onDelete}
            onRelink={onRelink}
          />
        ))
      )}
    </div>
  );
};
