import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CarryForwardBanner } from '../../components/CarryForwardBanner/CarryForwardBanner';

describe('CarryForwardBanner', () => {
  it('renders message with count', () => {
    render(<CarryForwardBanner carriedForwardCount={3} onDismiss={() => {}} />);
    expect(
      screen.getByText('3 commitment(s) carried forward from last week. Review and adjust as needed.'),
    ).toBeDefined();
  });

  it('renders nothing when count is 0', () => {
    const { container } = render(<CarryForwardBanner carriedForwardCount={0} onDismiss={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onDismiss when X clicked', () => {
    const onDismiss = vi.fn();
    render(<CarryForwardBanner carriedForwardCount={2} onDismiss={onDismiss} />);
    const dismissBtn = screen.getByTestId('dismiss-banner');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
