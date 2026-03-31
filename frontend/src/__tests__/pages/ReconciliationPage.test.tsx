import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReconciliationPage } from '../../pages/Reconciliation/ReconciliationPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPlanReconciling = {
  id: 'plan-1',
  userId: 'user-1',
  weekStartDate: '2026-03-23',
  status: 'RECONCILING' as const,
  createdAt: '2026-03-23T00:00:00Z',
  updatedAt: '2026-03-27T00:00:00Z',
};

const mockPlanDraft = {
  ...mockPlanReconciling,
  status: 'DRAFT' as const,
};

const mockTree = [
  {
    id: 'rc-1',
    title: 'Rally Cry 1',
    archived: false,
    definingObjectives: [
      {
        id: 'do-1',
        title: 'Objective 1',
        archived: false,
        outcomes: [
          { id: 'out-1', title: 'Outcome 1', archived: false },
        ],
      },
    ],
  },
];

const mockCommitmentsPending = [
  {
    id: 'c-1',
    planId: 'plan-1',
    outcomeId: 'out-1',
    title: 'Write tests',
    sortOrder: 1,
    actualStatus: 'PENDING' as const,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'c-2',
    planId: 'plan-1',
    outcomeId: 'out-1',
    title: 'Fix bugs',
    sortOrder: 2,
    actualStatus: 'PENDING' as const,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
];

const mockCommitmentsAnnotated = [
  { ...mockCommitmentsPending[0], actualStatus: 'DONE' as const },
  { ...mockCommitmentsPending[1], actualStatus: 'MISSED' as const },
];

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
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    userId: 'user-1',
    role: 'IC',
    teamId: 'team-1',
  }),
}));

describe('ReconciliationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockApi.plans.getPlan.mockResolvedValue(mockPlanReconciling);
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitmentsPending);
  });

  it('shows loading state initially', () => {
    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('loading')).toBeDefined();
  });

  it('renders title and stats bar for RECONCILING plan', async () => {
    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Reconcile Week/)).toBeDefined();
    });

    expect(screen.getByText('Reconciling')).toBeDefined();
    expect(screen.getByTestId('stats-bar')).toBeDefined();
  });

  it('renders commitment rows', async () => {
    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Write tests')).toBeDefined();
    });

    expect(screen.getByText('Fix bugs')).toBeDefined();
  });

  it('submit button disabled when not all commitments annotated', async () => {
    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-reconciliation')).toBeDefined();
    });

    const submitBtn = screen.getByTestId('submit-reconciliation') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('submit button enabled when all commitments annotated', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitmentsAnnotated);

    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-reconciliation')).toBeDefined();
    });

    const submitBtn = screen.getByTestId('submit-reconciliation') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
  });

  it('redirects to /my-week when plan is DRAFT', async () => {
    mockApi.plans.getPlan.mockResolvedValue(mockPlanDraft);

    render(
      <MemoryRouter>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/my-week', { replace: true });
    });
  });
});
