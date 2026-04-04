import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Shell } from '../../components/Shell/Shell';

const mockApi = {
  plans: {
    getPlan: vi.fn().mockResolvedValue({
      id: 'p1',
      userId: 'user-1',
      weekStartDate: '2026-04-07',
      status: 'DRAFT' as const,
      createdAt: '',
      updatedAt: '',
    }),
  },
  rcdo: { getTree: vi.fn(), searchOutcomes: vi.fn() },
  commitments: {},
  dashboard: { getTeamOverview: vi.fn(), getOrgOverview: vi.fn(), getExecutiveOverview: vi.fn() },
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 't',
    userId: 'user-1',
    role: 'IC' as const,
    teamId: 'team-1',
  }),
}));

describe('Shell', () => {
  it('renders sidebar and main children', () => {
    render(
      <MemoryRouter>
        <Shell>
          <div>Page body</div>
        </Shell>
      </MemoryRouter>,
    );

    expect(screen.getByText('Page body')).toBeDefined();
  });
});
