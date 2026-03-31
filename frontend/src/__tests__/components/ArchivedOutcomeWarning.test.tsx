import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchivedOutcomeWarning } from '../../components/ArchivedOutcomeWarning/ArchivedOutcomeWarning';

describe('ArchivedOutcomeWarning', () => {
  it('renders warning message', () => {
    render(
      <ArchivedOutcomeWarning
        commitmentId="c-1"
        outcomeName="Test Outcome"
        onRelink={() => {}}
      />,
    );
    expect(
      screen.getByText('This outcome has been archived. Please link to an active outcome before locking.'),
    ).toBeDefined();
  });

  it('calls onRelink with commitmentId when button clicked', () => {
    const onRelink = vi.fn();
    render(
      <ArchivedOutcomeWarning
        commitmentId="c-42"
        outcomeName="Test Outcome"
        onRelink={onRelink}
      />,
    );
    const relinkBtn = screen.getByTestId('relink-button');
    fireEvent.click(relinkBtn);
    expect(onRelink).toHaveBeenCalledWith('c-42');
  });
});
