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
    carriedForward: false,
    outcomeArchived: false,
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T00:00:00Z',
  },
];

const mockApi = {
  plans: {
    getPlan: vi.fn().mockResolvedValue(mockPlan),
    getPlanById: vi.fn(),
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

describe('WeeklyPlanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.plans.getPlan.mockResolvedValue(mockPlan);
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
    mockApi.commitments.listCommitments.mockResolvedValue(mockCommitments);
  });

  it('renders the page title with date and status badge', async () => {
    render(
      <MemoryRouter>
        <WeeklyPlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/My Week/)).toBeDefined();
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
});
