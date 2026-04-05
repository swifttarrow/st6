import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/EmptyState/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing here" description="Add something to get started." />);

    expect(screen.getByTestId('empty-state')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeDefined();
    expect(screen.getByText('Add something to get started.')).toBeDefined();
  });

  it('renders optional action button and calls onClick', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="T"
        description="D"
        action={{ label: 'Do it', onClick }}
      />,
    );

    fireEvent.click(screen.getByTestId('empty-state-action'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabling the action button', () => {
    render(
      <EmptyState
        title="T"
        description="D"
        action={{ label: 'Disabled', onClick: vi.fn(), disabled: true }}
      />,
    );

    expect((screen.getByRole('button', { name: 'Disabled' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
