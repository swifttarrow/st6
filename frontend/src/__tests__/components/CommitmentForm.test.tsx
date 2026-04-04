import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommitmentForm } from '../../components/CommitmentForm/CommitmentForm';

const mockTree = [
  {
    id: 'rc-1',
    name: 'Rally Cry 1',
    description: '',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Objective 1',
        description: '',
        outcomes: [
          { id: 'out-1', name: 'Outcome Alpha', description: '' },
          { id: 'out-2', name: 'Outcome Beta', description: '' },
        ],
      },
    ],
  },
];

describe('CommitmentForm', () => {
  it('submits create form when description and outcome are valid', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <CommitmentForm
        mode="create"
        tree={mockTree}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('What will you accomplish this week?'), {
      target: { value: 'Ship the feature' },
    });
    fireEvent.click(screen.getByText('Outcome Alpha'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Commitment' }));

    expect(onSubmit).toHaveBeenCalledWith({ description: 'Ship the feature', outcomeId: 'out-1' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows validation errors when fields are empty', () => {
    const onSubmit = vi.fn();
    render(
      <CommitmentForm mode="create" tree={mockTree} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Commitment' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Description is required')).toBeDefined();
    expect(screen.getByText('Linked outcome is required')).toBeDefined();
  });

  it('calls onCancel from the cancel button', () => {
    const onCancel = vi.fn();
    render(
      <CommitmentForm mode="create" tree={mockTree} onSubmit={vi.fn()} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <CommitmentForm mode="create" tree={mockTree} onSubmit={vi.fn()} onCancel={onCancel} />,
    );

    fireEvent.click(container.firstElementChild!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('filters local outcomes by search text', () => {
    render(
      <CommitmentForm mode="create" tree={mockTree} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
      target: { value: 'beta' },
    });

    expect(screen.queryByText('Outcome Alpha')).toBeNull();
    expect(screen.getByText('Outcome Beta')).toBeDefined();
  });

  it('shows no outcomes message when filter matches nothing', () => {
    render(
      <CommitmentForm mode="create" tree={mockTree} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('No outcomes found')).toBeDefined();
  });

  it('uses remote search results after debounce', async () => {
    vi.useFakeTimers();
    try {
      const searchOutcomes = vi.fn().mockResolvedValue([
        {
          outcomeId: 'remote-1',
          outcomeName: 'Remote outcome',
          definingObjectiveId: 'do-x',
          definingObjectiveName: 'DO X',
          rallyCryId: 'rc-x',
          rallyCryName: 'RC X',
        },
      ]);

      render(
        <CommitmentForm
          mode="create"
          tree={mockTree}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          searchOutcomes={searchOutcomes}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
        target: { value: 'rem' },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await act(async () => {});

      expect(searchOutcomes).toHaveBeenCalledWith('rem');
      expect(screen.getByText('Remote outcome')).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows empty remote list on search failure', async () => {
    vi.useFakeTimers();
    try {
      const searchOutcomes = vi.fn().mockRejectedValue(new Error('network'));

      render(
        <CommitmentForm
          mode="create"
          tree={mockTree}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          searchOutcomes={searchOutcomes}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
        target: { value: 'q' },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await act(async () => {});

      expect(screen.getByText('No outcomes found')).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('merges selected outcome into remote list when missing from API results', async () => {
    vi.useFakeTimers();
    try {
      const searchOutcomes = vi.fn().mockResolvedValue([
        {
          outcomeId: 'out-2',
          outcomeName: 'Outcome Beta',
          definingObjectiveId: 'do-1',
          definingObjectiveName: 'Objective 1',
          rallyCryId: 'rc-1',
          rallyCryName: 'Rally Cry 1',
        },
      ]);

      const commitment = {
        id: 'c-1',
        outcomeId: 'out-1',
        description: 'Existing',
        priority: 1,
        notes: null,
        actualStatus: null,
        reconciliationNotes: null,
        carriedForward: false,
        outcomeArchived: false,
        createdAt: '',
        updatedAt: '',
      };

      render(
        <CommitmentForm
          mode="edit"
          commitment={commitment}
          tree={mockTree}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          searchOutcomes={searchOutcomes}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
        target: { value: 'filter-remote' },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await act(async () => {});

      expect(screen.getByText('Outcome Alpha')).toBeDefined();
      expect(screen.getByText('Outcome Beta')).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('submits edit form with updated fields', () => {
    const onSubmit = vi.fn();
    const commitment = {
      id: 'c-1',
      outcomeId: 'out-1',
      description: 'Old text',
      priority: 1,
      notes: null,
      actualStatus: null,
      reconciliationNotes: null,
      carriedForward: false,
      outcomeArchived: false,
      createdAt: '',
      updatedAt: '',
    };

    render(
      <CommitmentForm
        mode="edit"
        commitment={commitment}
        tree={mockTree}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('What will you accomplish this week?'), {
      target: { value: 'Updated text' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledWith({ description: 'Updated text', outcomeId: 'out-1' });
  });
});
