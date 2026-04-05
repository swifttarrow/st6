import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HistoryPage } from '../../pages/History/HistoryPage';

const mockHistory = [
  {
    id: 'plan-3',
    weekStartDate: '2026-03-30',
    status: 'RECONCILED' as const,
    commitmentCount: 5,
  },
  {
    id: 'plan-2',
    weekStartDate: '2026-03-23',
    status: 'LOCKED' as const,
    commitmentCount: 3,
  },
  {
    id: 'plan-1',
    weekStartDate: '2026-03-16',
    status: 'RECONCILED' as const,
    commitmentCount: 4,
  },
];

const mockApi = {
  plans: {
    getPlan: vi.fn(),
    getExistingPlan: vi.fn(),
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

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.plans.listMyPlans.mockResolvedValue(mockHistory);
  });

  it('renders trend stats and the visual trend grid', async () => {
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('history-page')).toBeDefined();
    });

    expect(screen.getByText('History')).toBeDefined();
    expect(screen.getByText('Weeks with plans')).toBeDefined();
    expect(screen.getByTestId('history-trend-grid')).toBeDefined();
  });

  it('shows older unfinished weeks in the attention section', async () => {
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Needs attention')).toBeDefined();
    });

    expect(screen.getByText(/Older weeks below are still open/)).toBeDefined();
    expect(screen.getByText(/Locked · 3 commitments/)).toBeDefined();
  });
});
