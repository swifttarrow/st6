import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategyNodeRow } from '../../pages/StrategyManagement/StrategyNodeRow';

describe('StrategyNodeRow', () => {
  it('calls onCancelEdit from the inline edit toolbar', () => {
    const onCancelEdit = vi.fn();
    render(
      <StrategyNodeRow
        name="Node"
        level="outcome"
        editing
        editName="N"
        editDescription=""
        onEditNameChange={vi.fn()}
        onEditDescriptionChange={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={onCancelEdit}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onUnarchive for an archived rally cry', () => {
    const onUnarchive = vi.fn();
    render(
      <StrategyNodeRow
        name="Old RC"
        level="rally-cry"
        archived
        expanded={false}
        onToggleExpand={vi.fn()}
        onUnarchive={onUnarchive}
      />,
    );

    fireEvent.click(screen.getByTitle('Unarchive'));
    expect(onUnarchive).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleExpand without selecting the rally cry row', () => {
    const onToggleExpand = vi.fn();
    const onSelectRallyCry = vi.fn();
    render(
      <StrategyNodeRow
        name="RC"
        level="rally-cry"
        expanded={false}
        onSelectRallyCry={onSelectRallyCry}
        onToggleExpand={onToggleExpand}
      />,
    );

    fireEvent.click(screen.getByLabelText('Expand'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onSelectRallyCry).not.toHaveBeenCalled();
  });

  it('calls onSelectRallyCry when the row label is clicked', () => {
    const onSelectRallyCry = vi.fn();
    render(
      <StrategyNodeRow
        name="Selectable"
        level="rally-cry"
        onSelectRallyCry={onSelectRallyCry}
        onToggleExpand={vi.fn()}
        expanded
      />,
    );

    fireEvent.click(screen.getByText('Selectable'));
    expect(onSelectRallyCry).toHaveBeenCalledTimes(1);
  });

  it('calls onStartEdit from the pencil control', () => {
    const onStartEdit = vi.fn();
    render(
      <StrategyNodeRow
        name="Leaf"
        level="outcome"
        onStartEdit={onStartEdit}
        onArchive={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Edit'));
    expect(onStartEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onArchive from the archive control', () => {
    const onArchive = vi.fn();
    render(
      <StrategyNodeRow
        name="X"
        level="outcome"
        onStartEdit={vi.fn()}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByTitle('Archive'));
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it('calls onAddChild from the plus control', () => {
    const onAddChild = vi.fn();
    render(
      <StrategyNodeRow
        name="RC"
        level="rally-cry"
        onSelectRallyCry={vi.fn()}
        onToggleExpand={vi.fn()}
        expanded
        onAddChild={onAddChild}
        addChildLabel="Add Objective"
      />,
    );

    fireEvent.click(screen.getByTitle('Add Objective'));
    expect(onAddChild).toHaveBeenCalledTimes(1);
  });
});
