import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CommitmentRow } from '../../components/CommitmentRow/CommitmentRow';
import type { Commitment } from '../../api/types';

const commitment: Commitment = {
  id: 'c-1',
  outcomeId: 'out-1',
  description: 'Do the thing',
  priority: 1,
  notes: null,
  actualStatus: null,
  reconciliationNotes: null,
  carriedForward: false,
  outcomeArchived: true,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

function renderWithDnd(ui: React.ReactElement) {
  return render(
    <DndContext collisionDetection={closestCenter} onDragEnd={() => {}}>
      <SortableContext items={['c-1']} strategy={verticalListSortingStrategy}>
        {ui}
      </SortableContext>
    </DndContext>,
  );
}

describe('CommitmentRow', () => {
  it('calls onRelink when the outcome is archived', () => {
    const onRelink = vi.fn();
    renderWithDnd(
      <CommitmentRow
        commitment={commitment}
        rank={1}
        planStatus="DRAFT"
        tree={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onRelink={onRelink}
      />,
    );

    fireEvent.click(screen.getByTestId('relink-button'));
    expect(onRelink).toHaveBeenCalledWith('c-1');
  });
});
