import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusSelect } from '../../components/StatusSelect/StatusSelect';

describe('StatusSelect', () => {
  it('closes the menu when clicking outside', () => {
    const onChange = vi.fn();
    render(<StatusSelect value={null} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('status-select'));
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
