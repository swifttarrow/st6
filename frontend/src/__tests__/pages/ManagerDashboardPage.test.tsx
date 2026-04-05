import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ManagerDashboardPage } from '../../pages/ManagerDashboard/ManagerDashboardPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTeamOverview = {
  weekStartDate: '2026-03-23',
  stats: {
    directReports: 4,
    plansLocked: 3,
    totalCommitments: 22,
    avgCompletionRate: 78.5,
  },
  members: [
    {
      userId: 'alice',
      planId: 'plan-1',
      planStatus: 'LOCKED',
      commitmentCount: 7,
      topRallyCry: 'RC #1',
      completionRate: 80,
      priorWeekStartDate: '2026-03-16',
      priorWeekStatus: 'LOCKED',
    },
    {
      userId: 'bob',
      planId: 'plan-2',
      planStatus: 'DRAFT',
      commitmentCount: 6,
      topRallyCry: null,
      completionRate: null,
      priorWeekStartDate: null,
      priorWeekStatus: null,
    },
  ],
  rallyCryCoverage: [
    {
      rallyCryId: 'rc-1',
      rallyCryName: 'Rally Cry Alpha',
      commitmentCount: 10,
      memberCount: 4,
      consecutiveZeroWeeks: 0,
    },
    {
      rallyCryId: 'rc-2',
      rallyCryName: 'Rally Cry Beta',
      commitmentCount: 0,
      memberCount: 0,
      consecutiveZeroWeeks: 4,
    },
  ],
  definingObjectiveCoverage: [
    {
      definingObjectiveId: 'do-1',
      definingObjectiveName: 'DO Alpha',
      rallyCryId: 'rc-1',
      rallyCryName: 'Rally Cry Alpha',
      commitmentCount: 10,
      memberCount: 4,
      consecutiveZeroWeeks: 0,
    },
    {
      definingObjectiveId: 'do-2',
      definingObjectiveName: 'DO Beta',
      rallyCryId: 'rc-2',
      rallyCryName: 'Rally Cry Beta',
      commitmentCount: 0,
      memberCount: 0,
      consecutiveZeroWeeks: 4,
    },
  ],
};

const mockApi = {
  plans: {
    getPlan: vi.fn(),
    getExistingPlan: vi.fn(),
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
  },
};

const mockDirectReportIds = ['alice', 'bob'];

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

let mockRole = 'MANAGER';

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 'test-token',
    userId: 'manager-1',
    role: mockRole,
    teamId: 'team-1',
    directReportIds: mockDirectReportIds,
  }),
}));

describe('ManagerDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockRole = 'MANAGER';
    mockApi.dashboard.getTeamOverview.mockResolvedValue(mockTeamOverview);
  });

  it('shows loading state initially', () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders dashboard with stats for MANAGER role', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('manager-dashboard')).toBeDefined();
    });

    expect(screen.getByText('Team Dashboard')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined(); // directReports
    expect(screen.getByText('3/4')).toBeDefined(); // plansLocked
    expect(screen.getByText('22')).toBeDefined(); // totalCommitments
    expect(screen.getByText('79%')).toBeDefined(); // avgCompletionRate
  });

  it('renders team members table', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('team-members-table')).toBeDefined();
    });

    expect(screen.getByText('alice')).toBeDefined();
    expect(screen.getByText('bob')).toBeDefined();
    expect(screen.getByText('Locked')).toBeDefined();
    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByTestId('prior-week-attention-alice').textContent).toContain('Prior week still Locked');
  });

  it('renders coverage panels with zero-coverage warning', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('rally-cry-coverage-panel')).toBeDefined();
    });

    const rcPanel = screen.getByTestId('rally-cry-coverage-panel');
    const doPanel = screen.getByTestId('defining-objective-coverage-panel');
    expect(within(rcPanel).getByText('Rally Cry Alpha')).toBeDefined();
    expect(within(rcPanel).getByText('Rally Cry Beta')).toBeDefined();
    expect(within(doPanel).getByText('DO Alpha')).toBeDefined();
    expect(within(doPanel).getByText('DO Beta')).toBeDefined();
    expect(screen.getAllByText('No coverage - 4 week running').length).toBeGreaterThanOrEqual(2);
  });

  it('shows unlock button for locked plans', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('unlock-alice')).toBeDefined();
    });

    const unlockBtn = screen.getByTestId('unlock-alice');
    expect(unlockBtn.textContent).toBe('Unlock');
  });

  it('calls unlockPlan and refreshes on unlock click', async () => {
    mockApi.plans.unlockPlan.mockResolvedValue({});

    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('unlock-alice')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('unlock-alice'));

    await waitFor(() => {
      expect(mockApi.plans.unlockPlan).toHaveBeenCalledWith('plan-1');
    });

    // Should also re-fetch data
    expect(mockApi.dashboard.getTeamOverview.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('shows dismissible error toast when unlock fails', async () => {
    mockApi.plans.unlockPlan.mockRejectedValue(new Error('Cannot unlock'));

    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('unlock-alice')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('unlock-alice'));

    await waitFor(() => {
      expect(screen.getByTestId('error-toast')).toBeDefined();
    });

    expect(screen.getByText('Cannot unlock')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Dismiss error'));
    expect(screen.queryByTestId('error-toast')).toBeNull();
  });

  it('navigates to commitments when a member row is clicked', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('member-row-alice')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('member-row-alice'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/commitments\?.*planId=plan-1/),
    );
  });

  it('renders week navigator', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('week-navigator')).toBeDefined();
    });
  });

  it('redirects IC users to /commitments', () => {
    mockRole = 'IC';

    render(
      <MemoryRouter initialEntries={['/team']}>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    // IC role should not see the dashboard
    expect(screen.queryByTestId('manager-dashboard')).toBeNull();
  });

  it('redirects leadership users without explicit memberIds to /leadership', () => {
    mockRole = 'LEADERSHIP';

    render(
      <MemoryRouter initialEntries={['/team']}>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('manager-dashboard')).toBeNull();
    expect(mockApi.dashboard.getTeamOverview).not.toHaveBeenCalled();
  });

  it('shows error state on API failure', async () => {
    mockApi.dashboard.getTeamOverview.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });
});
