import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategyCreateModals } from '../../pages/StrategyManagement/StrategyCreateModals';
import type { RcdoTreeRallyCry } from '../../api/types';

const modalTree: RcdoTreeRallyCry[] = [
  {
    id: 'rc-1',
    name: 'RC Alpha',
    description: '',
    definingObjectives: [
      { id: 'do-1', name: 'DO One', description: '', archived: false, outcomes: [] },
      { id: 'do-2', name: 'DO Two', description: '', archived: false, outcomes: [] },
    ],
  },
  {
    id: 'rc-2',
    name: 'RC Beta',
    description: '',
    definingObjectives: [],
  },
];

describe('StrategyCreateModals', () => {
  function baseProps() {
    return {
      createName: '',
      createDescription: '',
      modalDoRallyCryId: '',
      modalOutcomeDoId: '',
      creating: false,
      onClose: vi.fn(),
      onCreateNameChange: vi.fn(),
      onCreateDescriptionChange: vi.fn(),
      onModalDoRallyCryIdChange: vi.fn(),
      onModalOutcomeDoIdChange: vi.fn(),
      onSubmitRallyCry: vi.fn(),
      onSubmitDo: vi.fn(),
      onSubmitOutcome: vi.fn(),
    };
  }

  it('invokes onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const props = baseProps();
    const { unmount } = render(
      <StrategyCreateModals
        {...props}
        onClose={onClose}
        modal={{ type: 'rally-cry' }}
        tree={modalTree}
      />,
    );

    fireEvent.click(screen.getByTestId('strategy-modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('invokes onModalDoRallyCryIdChange when parent RC changes in DO modal', () => {
    const onModalDoRallyCryIdChange = vi.fn();
    const props = baseProps();
    const { unmount } = render(
      <StrategyCreateModals
        {...props}
        onModalDoRallyCryIdChange={onModalDoRallyCryIdChange}
        modal={{ type: 'defining-objective', rallyCryId: 'rc-1' }}
        tree={modalTree}
      />,
    );

    fireEvent.change(screen.getByLabelText('Parent Rally Cry'), { target: { value: 'rc-2' } });
    expect(onModalDoRallyCryIdChange).toHaveBeenCalledWith('rc-2');
    unmount();
  });

  it('invokes onModalOutcomeDoIdChange when defining objective changes in outcome modal', () => {
    const onModalOutcomeDoIdChange = vi.fn();
    const props = baseProps();
    const { unmount } = render(
      <StrategyCreateModals
        {...props}
        onModalOutcomeDoIdChange={onModalOutcomeDoIdChange}
        modal={{ type: 'outcome', definingObjectiveId: 'do-1' }}
        tree={modalTree}
      />,
    );

    fireEvent.change(screen.getByLabelText('Defining Objective'), { target: { value: 'do-2' } });
    expect(onModalOutcomeDoIdChange).toHaveBeenCalledWith('do-2');
    unmount();
  });

  it('invokes onCreateNameChange and onCreateDescriptionChange from rally cry modal fields', () => {
    const onCreateNameChange = vi.fn();
    const onCreateDescriptionChange = vi.fn();
    const props = baseProps();
    const { unmount } = render(
      <StrategyCreateModals
        {...props}
        onCreateNameChange={onCreateNameChange}
        onCreateDescriptionChange={onCreateDescriptionChange}
        modal={{ type: 'rally-cry' }}
        tree={modalTree}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Revenue Growth'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Y' } });
    expect(onCreateNameChange).toHaveBeenCalledWith('X');
    expect(onCreateDescriptionChange).toHaveBeenCalledWith('Y');
    unmount();
  });
});
