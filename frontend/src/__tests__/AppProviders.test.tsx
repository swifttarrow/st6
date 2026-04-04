import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppProviders } from '../AppProviders';

const mockContext = {
  accessToken: 'test-token',
  userId: 'manager-1',
  role: 'MANAGER' as const,
  teamId: 'team-alpha',
  directReportIds: ['alice', 'bob'],
};

const LocationProbe: React.FC = () => {
  const location = useLocation();
  return <div>{location.pathname}</div>;
};

describe('AppProviders', () => {
  it('supports host-owned memory routing for embedded shells', () => {
    render(
      <AppProviders context={mockContext} router={{ type: 'memory', initialEntries: ['/team'] }}>
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </AppProviders>
    );

    expect(screen.getByText('/team')).toBeDefined();
  });
});
