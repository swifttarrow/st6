import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/Badge/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge label="Active" variant="active" />);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('renders with default variant', () => {
    render(<Badge label="Default" variant="default" />);
    expect(screen.getByText('Default')).toBeDefined();
  });
});
