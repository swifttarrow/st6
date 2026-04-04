import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StrategyBrowser } from '../../components/StrategyBrowser/StrategyBrowser';
import type { RcdoTreeRallyCry } from '../../api/types';

const tree: RcdoTreeRallyCry[] = [
  {
    id: 'rc-1',
    name: 'RC One',
    description: '',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'DO One',
        description: '',
        outcomes: [
          { id: 'o-1', name: 'Alpha Outcome', description: '' },
          { id: 'o-2', name: 'Beta Unique', description: '' },
        ],
      },
    ],
  },
];

describe('StrategyBrowser', () => {
  it('collapses and expands a rally cry section', () => {
    render(<StrategyBrowser tree={tree} />);

    const rcHeader = screen.getByText('RC One').parentElement!;
    fireEvent.click(rcHeader);
    expect(screen.queryByText('Alpha Outcome')).toBeNull();

    fireEvent.click(rcHeader);
    expect(screen.getByText('Alpha Outcome')).toBeDefined();
  });

  it('collapses and expands a defining objective section', () => {
    render(<StrategyBrowser tree={tree} />);

    const doHeader = screen.getByText('DO One').parentElement!;
    fireEvent.click(doHeader);
    expect(screen.queryByText('Alpha Outcome')).toBeNull();

    fireEvent.click(doHeader);
    expect(screen.getByText('Alpha Outcome')).toBeDefined();
  });

  it('filters outcomes by debounced search', async () => {
    vi.useFakeTimers();
    try {
      render(<StrategyBrowser tree={tree} />);

      fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
        target: { value: 'Unique' },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(screen.getByText('Beta Unique')).toBeDefined();
      expect(screen.queryByText('Alpha Outcome')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows no results when search matches nothing', async () => {
    vi.useFakeTimers();
    try {
      render(<StrategyBrowser tree={tree} />);

      fireEvent.change(screen.getByPlaceholderText('Search outcomes...'), {
        target: { value: 'zzz' },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(screen.getByText('No outcomes found')).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onSelectOutcome in interactive mode', () => {
    const onSelectOutcome = vi.fn();
    render(
      <StrategyBrowser
        tree={tree}
        interactive
        selectedOutcomeId="o-1"
        onSelectOutcome={onSelectOutcome}
      />,
    );

    fireEvent.click(screen.getByText('Beta Unique'));
    expect(onSelectOutcome).toHaveBeenCalledWith('o-2');
  });
});
