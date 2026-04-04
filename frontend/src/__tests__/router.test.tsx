import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Shell } from '../components/Shell/Shell';
import { AppRouter } from '../router';

const mockDraftPlan = {
  id: 'plan-1',
  userId: 'user-1',
  weekStartDate: '2026-04-07',
  status: 'DRAFT' as const,
  createdAt: '2026-04-07T00:00:00Z',
  updatedAt: '2026-04-07T00:00:00Z',
};

const mockReconcilingPlan = {
  ...mockDraftPlan,
  status: 'RECONCILING' as const,
};

const mockTree = [
  {
    id: 'rc-1',
    name: 'Rally Cry 1',
    description: '',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Objective 1',
        description: '',
        outcomes: [{ id: 'out-1', name: 'Outcome 1', description: '' }],
      },
    ],
  },
];

const mockCommitments = [
  {
    id: 'c-1',
    outcomeId: 'out-1',
    description: 'Item',
    priority: 1,
    notes: null,
    actualStatus: null,
    reconciliationNotes: null,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-04-07T00:00:00Z',
    updatedAt: '2026-04-07T00:00:00Z',
  },
];

const mockHistory = [
  {
    id: 'plan-h',
    weekStartDate: '2026-04-07',
    status: 'RECONCILED' as const,
    commitmentCount: 1,
  },
];

const mockTeamOverview = {
  weekStartDate: '2026-04-07',
  stats: {
    directReports: 1,
    plansLocked: 0,
    totalCommitments: 1,
    avgCompletionRate: null as number | null,
  },
  members: [
    {
      userId: 'alice',
      planId: 'plan-readonly',
      planStatus: 'LOCKED' as const,
      commitmentCount: 1,
      topRallyCry: 'RC',
      completionRate: null as number | null,
      priorWeekStartDate: null as string | null,
      priorWeekStatus: null as string | null,
    },
  ],
  rallyCryCoverage: [],
  definingObjectiveCoverage: [],
};

const mockOrgOverview = {
  weekStartDate: '2026-04-07',
  stats: {
    totalTeams: 2,
    activeRallyCries: 1,
    orgCommitments: 5,
    coverageGaps: 0,
  },
  hierarchy: [],
};

const mockExecutive = {
  focusWeekStart: '2026-04-07',
  focusWeek: {
    totalPlans: 2,
    draftCount: 0,
    lockedCount: 0,
    reconcilingCount: 0,
    reconciledCount: 2,
    distinctUsers: 2,
    distinctTeams: 1,
    totalCommitments: 4,
  },
  eightWeekTrend: [
    {
      weekStartDate: '2026-04-07',
      totalPlans: 2,
      draftCount: 0,
      lockedCount: 0,
      reconcilingCount: 0,
      reconciledCount: 2,
      totalCommitments: 4,
    },
  ],
  rallyCryCommitmentMix: [],
};

const strategyTree = [
  {
    id: 'rc-1',
    name: 'Revenue',
    description: '',
    archived: false,
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Pipeline',
        description: '',
        archived: false,
        outcomes: [{ id: 'oc-1', name: 'Win deals', description: '', archived: false }],
      },
    ],
  },
];

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
    createRallyCry: vi.fn(),
    updateRallyCry: vi.fn(),
    archiveRallyCry: vi.fn(),
    unarchiveRallyCry: vi.fn(),
    createDefiningObjective: vi.fn(),
    updateDefiningObjective: vi.fn(),
    archiveDefiningObjective: vi.fn(),
    unarchiveDefiningObjective: vi.fn(),
    createOutcome: vi.fn(),
    updateOutcome: vi.fn(),
    archiveOutcome: vi.fn(),
    unarchiveOutcome: vi.fn(),
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

vi.mock('../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

let mockRole: 'IC' | 'MANAGER' | 'LEADERSHIP' = 'IC';
let mockDirectReportIds: string[] | undefined = undefined;

vi.mock('../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 't',
    userId: 'user-1',
    role: mockRole,
    teamId: 'team-1',
    directReportIds: mockDirectReportIds,
  }),
}));

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Shell>
        <AppRouter />
      </Shell>
    </MemoryRouter>,
  );
}

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'IC';
    mockDirectReportIds = undefined;

    mockApi.plans.getPlan.mockResolvedValue(mockDraftPlan);
    mockApi.plans.getPlanById.mockResolvedValue(mockDraftPlan);
    mockApi.plans.listMyPlans.mockResolvedValue(mockHistory);
    mockApi.plans.transitionPlan.mockResolvedValue(mockReconcilingPlan);
    mockApi.plans.getTransitions.mockResolvedValue([]);
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
    mockApi.rcdo.searchOutcomes.mockResolvedValue([]);
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitments);
    mockApi.dashboard.getTeamOverview.mockResolvedValue(mockTeamOverview);
    mockApi.dashboard.getOrgOverview.mockResolvedValue(mockOrgOverview);
    mockApi.dashboard.getExecutiveOverview.mockResolvedValue(mockExecutive);

    for (const [key, fn] of Object.entries(mockApi.rcdo)) {
      if (key === 'getTree' || key === 'searchOutcomes') continue;
      if (typeof fn === 'function') {
        vi.mocked(fn).mockResolvedValue({});
      }
    }
  });

  it('redirects unknown paths to commitments for IC users', async () => {
    renderApp(['/does-not-exist']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Commitments/ })).toBeDefined();
    });
  });

  it('redirects /my-week to commitments', async () => {
    renderApp(['/my-week']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Commitments/ })).toBeDefined();
    });
  });

  it('renders history for /history', async () => {
    renderApp(['/history']);

    await waitFor(() => {
      expect(screen.getByTestId('history-page')).toBeDefined();
    });
  });

  it('renders reconciliation when plan is in RECONCILING status', async () => {
    mockApi.plans.getPlan.mockResolvedValue(mockReconcilingPlan);

    renderApp(['/reconciliation']);

    await waitFor(() => {
      expect(screen.getByTestId('submit-reconciliation')).toBeDefined();
    });
  });

  it('renders manager dashboard for /team', async () => {
    mockRole = 'MANAGER';
    mockDirectReportIds = ['alice'];

    renderApp(['/team']);

    await waitFor(() => {
      expect(screen.getByTestId('manager-dashboard')).toBeDefined();
    });
  });

  it('renders leadership view for /leadership', async () => {
    mockRole = 'LEADERSHIP';

    renderApp(['/leadership']);

    await waitFor(() => {
      expect(screen.getByTestId('leadership-view')).toBeDefined();
    });
  });

  it('redirects /leadership/executive to executive overview', async () => {
    mockRole = 'LEADERSHIP';

    renderApp(['/leadership/executive']);

    await waitFor(() => {
      expect(screen.getByTestId('executive-overview')).toBeDefined();
    });
  });

  it('renders strategy management for /strategy', async () => {
    mockRole = 'MANAGER';
    mockApi.rcdo.getTree.mockResolvedValue(strategyTree);

    renderApp(['/strategy']);

    await waitFor(() => {
      expect(screen.getByTestId('strategy-management')).toBeDefined();
    });
  });

  it('renders executive overview for /executive', async () => {
    mockRole = 'LEADERSHIP';

    renderApp(['/executive']);

    await waitFor(() => {
      expect(screen.getByTestId('executive-overview')).toBeDefined();
    });
  });
});
