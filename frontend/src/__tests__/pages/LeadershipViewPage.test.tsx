import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadershipViewPage } from '../../pages/LeadershipView/LeadershipViewPage';

const mockOrgOverview = {
  weekStartDate: '2026-03-23',
  stats: {
    totalTeams: 8,
    activeRallyCries: 3,
    orgCommitments: 45,
    coverageGaps: 2,
  },
  hierarchy: [
    {
      type: 'RALLY_CRY',
      id: 'rc-1',
      name: 'Revenue Growth',
      teamCount: 6,
      totalTeams: 8,
      commitmentCount: 20,
      coveragePercent: 75,
      status: 'ON_TRACK',
      consecutiveZeroWeeks: 0,
      warningNote: null,
      children: [
        {
          type: 'DEFINING_OBJECTIVE',
          id: 'do-1',
          name: 'Expand Enterprise Sales',
          teamCount: 4,
          totalTeams: 8,
          commitmentCount: 12,
          coveragePercent: 50,
          status: 'AT_RISK',
          children: [],
        },
      ],
    },
    {
      type: 'RALLY_CRY',
      id: 'rc-2',
      name: 'Customer Retention',
      teamCount: 0,
      totalTeams: 8,
      commitmentCount: 0,
      coveragePercent: 0,
      status: 'ALERT',
      consecutiveZeroWeeks: 5,
      warningNote: 'No coverage for 5 consecutive weeks',
      children: [],
    },
  ],
};

const mockApi = {
  plans: {
    getPlan: vi.fn(),
    getPlanById: vi.fn(),
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
  },
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

let mockRole = 'LEADERSHIP';

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 'test-token',
    userId: 'leader-1',
    role: mockRole,
    teamId: 'team-1',
  }),
}));

describe('LeadershipViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'LEADERSHIP';
    mockApi.dashboard.getOrgOverview.mockResolvedValue(mockOrgOverview);
  });

  it('renders title and stats', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('leadership-view')).toBeDefined();
    });

    expect(screen.getByText('Organization Overview')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined(); // totalTeams
    expect(screen.getByText('3')).toBeDefined(); // activeRallyCries
    expect(screen.getByText('45')).toBeDefined(); // orgCommitments
    expect(screen.getByText('2')).toBeDefined(); // coverageGaps
  });

  it('renders hierarchy table with RC and DO rows', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hierarchy-coverage-table')).toBeDefined();
    });

    expect(screen.getByText('Revenue Growth')).toBeDefined();
    expect(screen.getByText('Customer Retention')).toBeDefined();
    expect(screen.getByText('Expand Enterprise Sales')).toBeDefined();
  });

  it('shows CoverageStatusBadge with correct status', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('hierarchy-coverage-table')).toBeDefined();
    });

    const badges = screen.getAllByTestId('coverage-status-badge');
    const badgeTexts = badges.map((b) => b.textContent);
    expect(badgeTexts).toContain('On Track');
    expect(badgeTexts).toContain('At Risk');
    expect(badgeTexts).toContain('Alert');
  });

  it('shows CoverageAlert for high consecutiveZeroWeeks', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('coverage-alert')).toBeDefined();
    });

    expect(screen.getByText('No coverage for 5 consecutive weeks')).toBeDefined();
  });

  it('Coverage Gaps stat is red when > 0', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('leadership-view')).toBeDefined();
    });

    const statCards = screen.getAllByTestId('stat-card');
    const gapsCard = statCards[3];
    const valueEl = within(gapsCard).getByTestId('stat-card-value');
    expect(valueEl.getAttribute('style')).toContain('color');
    expect(valueEl.getAttribute('style')).toContain('rgb(228, 35, 19)');
  });

  it('redirects non-LEADERSHIP users to /commitments', () => {
    mockRole = 'IC';

    render(
      <MemoryRouter initialEntries={['/leadership']}>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('leadership-view')).toBeNull();
  });

  it('redirects MANAGER role to /commitments', () => {
    mockRole = 'MANAGER';

    render(
      <MemoryRouter initialEntries={['/leadership']}>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('leadership-view')).toBeNull();
  });

  it('shows week navigator', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('week-navigator')).toBeDefined();
    });
  });

  it('reloads org overview when the week navigator advances', async () => {
    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('leadership-view')).toBeDefined();
    });

    const callsBefore = mockApi.dashboard.getOrgOverview.mock.calls.length;
    fireEvent.click(screen.getByTestId('week-nav-prev'));

    await waitFor(() => {
      expect(mockApi.dashboard.getOrgOverview.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it('shows error state on API failure', async () => {
    mockApi.dashboard.getOrgOverview.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <LeadershipViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });
});
