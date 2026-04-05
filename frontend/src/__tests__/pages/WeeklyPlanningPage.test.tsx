import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WeeklyPlanningPage } from '../../pages/WeeklyPlanning/WeeklyPlanningPage';

const mockPlan = {
  id: 'plan-1',
  userId: 'user-1',
  weekStartDate: '2026-03-30',
  status: 'DRAFT' as const,
  createdAt: '2026-03-30T00:00:00Z',
  updatedAt: '2026-03-30T00:00:00Z',
};

const mockTree = [
  {
    id: 'rc-1',
    name: 'Rally Cry 1',
    description: 'RC desc',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Objective 1',
        description: 'DO desc',
        outcomes: [
          { id: 'out-1', name: 'Outcome 1', description: 'OC desc' },
        ],
      },
    ],
  },
];

const mockCommitments = [
  {
    id: 'c-1',
    outcomeId: 'out-1',
    description: 'Test commitment',
    priority: 1,
    notes: null,
    actualStatus: null,
    reconciliationNotes: null,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T00:00:00Z',
  },
];

const mockTeamOverview = {
  weekStartDate: '2026-03-30',
  stats: {
    directReports: 1,
    plansLocked: 1,
    totalCommitments: 1,
    avgCompletionRate: null,
  },
  members: [
    {
      userId: 'alice',
      planId: 'plan-readonly',
      planStatus: 'LOCKED',
      commitmentCount: 1,
      topRallyCry: 'Rally Cry 1',
      completionRate: null,
      priorWeekStartDate: '2026-03-23',
      priorWeekStatus: 'LOCKED',
    },
  ],
  rallyCryCoverage: [],
  definingObjectiveCoverage: [],
};

const mockDirectReportIds = ['alice'];

const mockApi = {
  plans: {
    getPlan: vi.fn().mockResolvedValue(mockPlan),
    getPlanById: vi.fn(),
    listMyPlans: vi.fn().mockResolvedValue([]),
    transitionPlan: vi.fn(),
    unlockPlan: vi.fn(),
    getTransitions: vi.fn(),
  },
  rcdo: {
    getTree: vi.fn().mockResolvedValue(mockTree),
    searchOutcomes: vi.fn(),
  },
  commitments: {
    listCommitments: vi.fn().mockResolvedValue(mockCommitments),
    createCommitment: vi.fn(),
    updateCommitment: vi.fn(),
    deleteCommitment: vi.fn(),
    reorderCommitments: vi.fn(),
    reconcileCommitment: vi.fn(),
    bulkReconcile: vi.fn(),
  },
  dashboard: {
    getTeamOverview: vi.fn().mockResolvedValue(mockTeamOverview),
  },
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

let mockRole: 'IC' | 'MANAGER' | 'LEADERSHIP' = 'IC';

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 'test-token',
    userId: 'user-1',
    role: mockRole,
    teamId: 'team-1',
    directReportIds: mockRole === 'MANAGER' ? mockDirectReportIds : undefined,
  }),
}));

describe('WeeklyPlanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'IC';
    mockApi.plans.getPlan.mockResolvedValue(mockPlan);
    mockApi.plans.getPlanById.mockResolvedValue({ ...mockPlan, id: 'plan-readonly', userId: 'alice' });
    mockApi.plans.listMyPlans.mockResolvedValue([]);
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitments);
    mockApi.dashboard.getTeamOverview.mockResolvedValue(mockTeamOverview);
  });

  it('renders the page title with date and status badge', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Commitments/)).toBeDefined();
    });

    expect(screen.getByText('Draft')).toBeDefined();
  });

  it('renders commitments from API', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test commitment')).toBeDefined();
    });
  });

  it('renders strategy browser with tree data', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Strategy Hierarchy')).toBeDefined();
    });

    expect(screen.getByText('Rally Cry 1')).toBeDefined();
  });

  it('shows loading state initially', () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('shows action buttons in DRAFT status', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Plan' })).toBeDefined();
    });

    expect(screen.getByText('Add Commitment')).toBeDefined();
  });

  it('surfaces a stuck prior week for the current user even after the current week is locked', async () => {
    mockApi.plans.getPlan.mockResolvedValue({ ...mockPlan, status: 'LOCKED' as const });
    mockApi.plans.listMyPlans.mockResolvedValue([
      {
        id: 'prior-plan',
        weekStartDate: '2026-03-23',
        status: 'LOCKED',
        commitmentCount: 2,
      },
    ]);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('prior-week-reconcile-banner')).toBeDefined();
    });

    expect(screen.getByText(/Your prior week/)).toBeDefined();
    expect(screen.getByText(/Carry-forward into this week cannot finish/)).toBeDefined();
  });

  it('surfaces a stuck prior week when a manager drills into a direct report plan', async () => {
    mockRole = 'MANAGER';

    render(
      <MemoryRouter initialEntries={['/commitments?planId=plan-readonly&memberIds=alice']}>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('read-only-banner')).toBeDefined();
    });

    expect(screen.getByTestId('prior-week-reconcile-banner').textContent).toContain("alice's prior week");
  });

  it('shows empty commitments state when the plan has no items', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No commitments yet')).toBeDefined();
    });

    expect(
      screen.getByText('Use Add Commitment in the toolbar to link an outcome to this week.'),
    ).toBeDefined();
  });

  it('opens the commitment form when Add Commitment is clicked', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Commitment' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Commitment' }));

    expect(screen.getByRole('heading', { name: 'Add Commitment' })).toBeDefined();
  });

  it('shows strategy empty state when the tree is empty', async () => {
    mockApi.rcdo.getTree.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No strategies found')).toBeDefined();
    });
  });

  it('renders plan history rows when listMyPlans returns past weeks', async () => {
    mockApi.plans.listMyPlans.mockImplementation((from: string, to: string) => {
      if (from === to) {
        return Promise.resolve([]);
      }
      return Promise.resolve([
        {
          id: 'hist-1',
          weekStartDate: '2026-03-16',
          status: 'RECONCILED' as const,
          commitmentCount: 2,
        },
        {
          id: 'hist-2',
          weekStartDate: '2026-03-23',
          status: 'LOCKED' as const,
          commitmentCount: 1,
        },
      ]);
    });

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Your plan history')).toBeDefined();
    });

    expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Reconcile').length).toBeGreaterThan(0);
  });

  it('shows load error when getPlan fails', async () => {
    mockApi.plans.getPlan.mockRejectedValue(new Error('Plan service down'));

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Plan service down')).toBeDefined();
    });
  });

  it('shows carry-forward banner when draft plan has carried-forward commitments', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue([
      {
        ...mockCommitments[0],
        carriedForward: true,
      },
    ]);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('carry-forward-banner')).toBeDefined();
    });
  });

  it('locks the plan when Lock Plan is clicked', async () => {
    mockApi.plans.transitionPlan.mockResolvedValue({
      ...mockPlan,
      status: 'LOCKED' as const,
    });

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Plan' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock Plan' }));

    await waitFor(() => {
      expect(mockApi.plans.transitionPlan).toHaveBeenCalledWith('plan-1', 'LOCKED');
    });
  });

  it('begins reconciliation when the plan is locked', async () => {
    mockApi.plans.getPlan.mockResolvedValue({ ...mockPlan, status: 'LOCKED' as const });
    mockApi.plans.transitionPlan.mockResolvedValue({
      ...mockPlan,
      status: 'RECONCILING' as const,
    });

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Begin Reconciliation' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Begin Reconciliation' }));

    await waitFor(() => {
      expect(mockApi.plans.transitionPlan).toHaveBeenCalledWith('plan-1', 'RECONCILING');
    });
  });

  it('updates a commitment through the edit form', async () => {
    mockApi.commitments.updateCommitment.mockResolvedValue({
      ...mockCommitments[0],
      description: 'Updated desc',
    });

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit commitment' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit commitment' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Commitment' })).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText('What will you accomplish this week?'), {
      target: { value: 'Updated desc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mockApi.commitments.updateCommitment).toHaveBeenCalledWith('plan-1', 'c-1', {
        description: 'Updated desc',
        outcomeId: 'out-1',
      });
    });
  });

  it('deletes a commitment when delete is confirmed', async () => {
    mockApi.commitments.deleteCommitment.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete commitment' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete commitment' }));

    await waitFor(() => {
      expect(mockApi.commitments.deleteCommitment).toHaveBeenCalledWith('plan-1', 'c-1');
    });
  });

  it('loads the previous week when WeekNavigator prev is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/commitments?week=2026-03-30']}>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockApi.plans.getPlan).toHaveBeenCalledWith('2026-03-30');
    });

    mockApi.plans.getPlan.mockClear();
    fireEvent.click(screen.getByTestId('week-nav-prev'));

    await waitFor(() => {
      expect(mockApi.plans.getPlan).toHaveBeenCalledWith('2026-03-23');
    });
  });

  it('shows a dismissible toast when lock fails', async () => {
    mockApi.plans.transitionPlan.mockRejectedValue(new Error('Lock service unavailable'));

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Plan' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock Plan' }));

    await waitFor(() => {
      expect(screen.getByText('Lock service unavailable')).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Dismiss error'));
    expect(screen.queryByTestId('error-toast')).toBeNull();
  });

  it('blocks lock and shows a toast when commitments reference archived outcomes', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue([
      { ...mockCommitments[0], outcomeArchived: true },
    ]);

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Plan' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock Plan' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Cannot lock: .* commitment\(s\) reference archived outcomes/),
      ).toBeDefined();
    });

    expect(mockApi.plans.transitionPlan).not.toHaveBeenCalled();
  });

  it('shows a toast when begin reconciliation fails', async () => {
    mockApi.plans.getPlan.mockResolvedValue({ ...mockPlan, status: 'LOCKED' as const });
    mockApi.plans.transitionPlan.mockRejectedValue(new Error('Cannot enter reconciliation'));

    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Begin Reconciliation' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Begin Reconciliation' }));

    await waitFor(() => {
      expect(screen.getByText('Cannot enter reconciliation')).toBeDefined();
    });
  });

  it('closes the add-commitment form when Cancel is clicked', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Commitment' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Commitment' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Commitment' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('heading', { name: 'Add Commitment' })).toBeNull();
  });

  it('loads a direct report plan when manager selects them in the person picker', async () => {
    mockRole = 'MANAGER';

    render(
      <MemoryRouter initialEntries={['/commitments?week=2026-03-30&memberIds=alice']}>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('commitments-person-picker')).toBeDefined();
    });

    mockApi.plans.getPlanById.mockClear();
    fireEvent.change(screen.getByLabelText('Person'), {
      target: { value: 'plan-readonly' },
    });

    await waitFor(() => {
      expect(mockApi.plans.getPlanById).toHaveBeenCalledWith('plan-readonly');
    });
  });
});
