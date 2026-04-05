import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReconciliationPage } from '../../pages/Reconciliation/ReconciliationPage';
import { ApiError } from '../../api/types';

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

const mockPlanReconciled = {
  ...mockPlanReconciling,
  status: 'RECONCILED' as const,
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

const mockCommitmentsPending = [
  {
    id: 'c-1',
    outcomeId: 'out-1',
    description: 'Write tests',
    priority: 1,
    notes: null,
    actualStatus: null,
    reconciliationNotes: null,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'c-2',
    outcomeId: 'out-1',
    description: 'Fix bugs',
    priority: 2,
    notes: null,
    actualStatus: null,
    reconciliationNotes: null,
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
];

const mockCommitmentsAnnotated = [
  { ...mockCommitmentsPending[0], actualStatus: 'COMPLETED' as const },
  { ...mockCommitmentsPending[1], actualStatus: 'NOT_STARTED' as const },
];

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
};

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    accessToken: 'test-token',
    userId: 'user-1',
    role: 'IC',
    teamId: 'team-1',
  }),
}));

describe('ReconciliationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockApi.plans.getExistingPlan.mockResolvedValue(mockPlanReconciling);
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitmentsPending);
  });

  const routerOpts = { initialEntries: ['/reconciliation?week=2026-03-23'] };

  it('shows loading state initially', () => {
    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('loading')).toBeDefined();
  });

  it('renders title and stats bar for RECONCILING plan', async () => {
    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Reconcile Week/)).toBeDefined();
    });

    expect(screen.getByText('Reconciling')).toBeDefined();
    expect(screen.getByTestId('stats-bar')).toBeDefined();
    expect(screen.getByText('Not started')).toBeDefined();
  });

  it('renders commitment rows', async () => {
    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Write tests')).toBeDefined();
    });

    expect(screen.getByText('Fix bugs')).toBeDefined();
  });

  it('shows an empty-week CTA when there are no commitments', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue([]);

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No commitments this week')).toBeDefined();
    });

    expect(screen.getByRole('button', { name: 'Finish Empty Week' })).toBeDefined();
  });

  it('submit button disabled when not all commitments annotated', async () => {
    render(
      <MemoryRouter {...routerOpts}>
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
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-reconciliation')).toBeDefined();
    });

    const submitBtn = screen.getByTestId('submit-reconciliation') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
  });

  it('sends reconciliation notes with status updates', async () => {
    mockApi.commitments.reconcileCommitment.mockResolvedValue({
      ...mockCommitmentsPending[0],
      actualStatus: 'COMPLETED',
      reconciliationNotes: 'Shipped Wednesday',
    });

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Write tests')).toBeDefined();
    });

    fireEvent.change(screen.getByTestId('notes-c-1'), { target: { value: 'Shipped Wednesday' } });
    fireEvent.click(screen.getAllByTestId('status-select')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Completed' }));

    await waitFor(() => {
      expect(mockApi.commitments.reconcileCommitment).toHaveBeenCalledWith('plan-1', 'c-1', {
        actualStatus: 'COMPLETED',
        reconciliationNotes: 'Shipped Wednesday',
      });
    });
  });

  it('rehydrates reconciliation notes on reconciled plans', async () => {
    mockApi.plans.getExistingPlan.mockResolvedValue(mockPlanReconciled);
    mockApi.commitments.listCommitments.mockResolvedValue([
      {
        ...mockCommitmentsPending[0],
        actualStatus: 'COMPLETED' as const,
        reconciliationNotes: 'Delivered on Wednesday',
      },
    ]);

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Reconciled')).toBeDefined();
    });

    expect(screen.getByText('Delivered on Wednesday')).toBeDefined();
    expect(screen.queryByTestId('submit-reconciliation')).toBeNull();
  });

  it('redirects to /commitments when plan is DRAFT', async () => {
    mockApi.plans.getExistingPlan.mockResolvedValue(mockPlanDraft);

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/commitments?week=2026-03-23', { replace: true });
    });
  });

  it('submits reconciliation and transitions the plan to RECONCILED', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitmentsAnnotated);
    mockApi.plans.transitionPlan.mockResolvedValue({
      ...mockPlanReconciling,
      status: 'RECONCILED' as const,
    });

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const btn = screen.getByTestId('submit-reconciliation') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByTestId('submit-reconciliation'));

    await waitFor(() => {
      expect(mockApi.plans.transitionPlan).toHaveBeenCalledWith('plan-1', 'RECONCILED');
    });
  });

  it('finishes an empty week from the empty state', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue([]);
    mockApi.plans.transitionPlan.mockResolvedValue({
      ...mockPlanReconciling,
      status: 'RECONCILED' as const,
    });

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finish Empty Week' })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Finish Empty Week' }));

    await waitFor(() => {
      expect(mockApi.plans.transitionPlan).toHaveBeenCalledWith('plan-1', 'RECONCILED');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to Commitments' })).toBeDefined();
    });
  });

  it('dismisses error toast when reconcileCommitment fails', async () => {
    mockApi.commitments.reconcileCommitment.mockRejectedValue(new Error('Server conflict'));

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('status-select').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByTestId('status-select')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Completed' }));

    await waitFor(() => {
      expect(screen.getByText('Server conflict')).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Dismiss error'));
    expect(screen.queryByTestId('error-toast')).toBeNull();
  });

  it('shows conflict message when submit returns HTTP 409', async () => {
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitmentsAnnotated);
    mockApi.plans.transitionPlan.mockRejectedValue(
      new ApiError(409, 'Conflict', 'Plan already reconciled'),
    );

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-reconciliation')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('submit-reconciliation'));

    await waitFor(() => {
      expect(
        screen.getByText('This plan has already been reconciled or is in a conflicting state.'),
      ).toBeDefined();
    });
  });

  it('reconciles again with updated notes when the notes field is blurred after status is set', async () => {
    mockApi.commitments.reconcileCommitment.mockImplementation(async (_planId, id, body) => ({
      ...mockCommitmentsPending.find((c) => c.id === id)!,
      actualStatus: body.actualStatus,
      reconciliationNotes: body.reconciliationNotes ?? null,
    }));

    render(
      <MemoryRouter {...routerOpts}>
        <ReconciliationPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('notes-c-1')).toBeDefined();
    });

    fireEvent.click(screen.getAllByTestId('status-select')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Completed' }));

    await waitFor(() => {
      expect(mockApi.commitments.reconcileCommitment).toHaveBeenCalled();
    });

    mockApi.commitments.reconcileCommitment.mockClear();

    fireEvent.change(screen.getByTestId('notes-c-1'), { target: { value: 'Shipped Tuesday' } });
    fireEvent.blur(screen.getByTestId('notes-c-1'));

    await waitFor(() => {
      expect(mockApi.commitments.reconcileCommitment).toHaveBeenCalledWith('plan-1', 'c-1', {
        actualStatus: 'COMPLETED',
        reconciliationNotes: 'Shipped Tuesday',
      });
    });
  });
});
