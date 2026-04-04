import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      expect(screen.getByText('Lock Plan')).toBeDefined();
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
});
