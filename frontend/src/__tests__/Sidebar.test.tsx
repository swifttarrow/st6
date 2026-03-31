import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar/Sidebar';

function renderSidebar(role: 'IC' | 'MANAGER' | 'LEADERSHIP') {
  return render(
    <MemoryRouter initialEntries={['/my-week']}>
      <Sidebar userRole={role} />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('shows only IC nav items for IC role', () => {
    renderSidebar('IC');
    expect(screen.getByText('My Week')).toBeDefined();
    expect(screen.getByText('Reconciliation')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.queryByText('Team Dashboard')).toBeNull();
    expect(screen.queryByText('Leadership View')).toBeNull();
  });

  it('shows Team Dashboard for MANAGER role', () => {
    renderSidebar('MANAGER');
    expect(screen.getByText('Team Dashboard')).toBeDefined();
    expect(screen.queryByText('Leadership View')).toBeNull();
  });

  it('shows all nav items for LEADERSHIP role', () => {
    renderSidebar('LEADERSHIP');
    expect(screen.getByText('Team Dashboard')).toBeDefined();
    expect(screen.getByText('Leadership View')).toBeDefined();
  });

  it('renders WCT logo text', () => {
    renderSidebar('IC');
    expect(screen.getByText('WCT')).toBeDefined();
  });
});
