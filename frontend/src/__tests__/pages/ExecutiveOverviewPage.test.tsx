import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExecutiveOverviewPage } from '../../pages/ExecutiveOverview/ExecutiveOverviewPage';
import type { ExecutiveOverviewResponse } from '../../api/types';

function buildExecutivePayload(overrides: Partial<ExecutiveOverviewResponse['focusWeek']> = {}): ExecutiveOverviewResponse {
  const focusWeek = {
    totalPlans: 10,
    draftCount: 1,
    lockedCount: 2,
    reconcilingCount: 1,
    reconciledCount: 5,
    distinctUsers: 8,
    distinctTeams: 3,
    totalCommitments: 40,
    ...overrides,
  };

  return {
    focusWeekStart: '2026-04-07',
    focusWeek,
    eightWeekTrend: [
      {
        weekStartDate: '2026-04-07',
        totalPlans: focusWeek.totalPlans,
        draftCount: focusWeek.draftCount,
        lockedCount: focusWeek.lockedCount,
        reconcilingCount: focusWeek.reconcilingCount,
        reconciledCount: focusWeek.reconciledCount,
        totalCommitments: focusWeek.totalCommitments,
      },
    ],
    rallyCryCommitmentMix: [
      {
        rallyCryId: 'rc-1',
        rallyCryName: 'North Star',
        commitmentCount: 20,
        percentOfOrgCommitments: 50,
      },
      {
        rallyCryId: 'rc-2',
        rallyCryName: 'Other',
        commitmentCount: 10,
        percentOfOrgCommitments: 120,
      },
    ],
  };
}

const mockApi = {
  plans: {
    getPlan: vi.fn(),
    getPlanById: vi.fn(),
    listMyPlans: vi.fn(),
    transitionPlan: vi.fn(),
    unlockPlan: vi.fn(),
    getTransitions: vi.fn(),
  },
  rcdo: {
    getTree: vi.fn(),
    searchOutcomes: vi.fn(),
  },
  commitments: {
    listCommitments: vi.fn(),
    createCommitment: vi.fn(),
    updateCommitment: vi.fn(),
    deleteCommitment: vi.fn(),
    reorderCommitments: vi.fn(),
    reconcileCommitment: vi.fn(),
    bulkReconcile: vi.fn(),
  },
  dashboard: {
    getTeamOverview: vi.fn(),
    getOrgOverview: vi.fn(),
    getExecutiveOverview: vi.fn(),
  },
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

let mockRole: 'IC' | 'MANAGER' | 'LEADERSHIP' = 'LEADERSHIP';

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 't',
    userId: 'exec-1',
    role: mockRole,
    teamId: 'team-1',
  }),
}));

describe('ExecutiveOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'LEADERSHIP';
    mockApi.dashboard.getExecutiveOverview.mockResolvedValue(buildExecutivePayload());
  });

  it('redirects non-LEADERSHIP users', () => {
    mockRole = 'IC';

    render(
      <MemoryRouter initialEntries={['/executive']}>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('executive-overview')).toBeNull();
  });

  it('renders stats, trend table, and mix section', async () => {
    render(
      <MemoryRouter>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('executive-overview')).toBeDefined();
    });

    expect(screen.getByText('Executive rollup')).toBeDefined();
    expect(screen.getByText('North Star')).toBeDefined();
    expect(screen.getByText(/Open hierarchy coverage view/)).toBeDefined();
  });

  it('uses neutral reconciled tone when reconciledCount is zero', async () => {
    mockApi.dashboard.getExecutiveOverview.mockResolvedValue(
      buildExecutivePayload({ reconciledCount: 0, totalPlans: 4 }),
    );

    render(
      <MemoryRouter>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('executive-overview')).toBeDefined();
    });

    const reconciledCard = screen
      .getAllByTestId('stat-card')
      .find((el) => within(el).queryByText('Reconciled plans'));
    expect(reconciledCard).toBeDefined();
    expect(within(reconciledCard!).getByTestId('stat-card-value').textContent).toBe('0');
  });

  it('shows singular plan copy when totalPlans is 1', async () => {
    mockApi.dashboard.getExecutiveOverview.mockResolvedValue(
      buildExecutivePayload({
        totalPlans: 1,
        reconciledCount: 1,
        draftCount: 0,
        lockedCount: 0,
        reconcilingCount: 0,
      }),
    );

    render(
      <MemoryRouter>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/100% of 1 plan\b/)).toBeDefined();
    });
  });

  it('shows error when the API fails', async () => {
    mockApi.dashboard.getExecutiveOverview.mockRejectedValue(new Error('boom'));

    render(
      <MemoryRouter>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeDefined();
    });
  });

  it('shows no data when response is empty', async () => {
    mockApi.dashboard.getExecutiveOverview.mockResolvedValue(null as unknown as ExecutiveOverviewResponse);

    render(
      <MemoryRouter>
        <ExecutiveOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeDefined();
    });
  });
});
