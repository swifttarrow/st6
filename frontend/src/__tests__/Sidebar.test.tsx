import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserContextProvider } from '../context/UserContext';
import { Sidebar } from '../components/Sidebar/Sidebar';

/** Stable reference — useReconciliationNavAvailable depends on `api` in useEffect. */
const { mockApi, mockGetExistingPlan } = vi.hoisted(() => {
  const mockGetExistingPlanInner = vi.fn();
  const api = {
    plans: {
      getPlan: vi.fn(),
      getExistingPlan: mockGetExistingPlanInner,
      getPlanById: vi.fn(),
      listMyPlans: vi.fn(),
      transitionPlan: vi.fn(),
      unlockPlan: vi.fn(),
      getTransitions: vi.fn(),
    },
    rcdo: { getTree: vi.fn(), searchOutcomes: vi.fn() },
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
  return { mockApi: api, mockGetExistingPlan: mockGetExistingPlanInner };
});

vi.mock('../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

const mockPlanReconciling = {
  id: 'plan-1',
  userId: 'user-1',
  weekStartDate: '2026-03-23',
  status: 'RECONCILING' as const,
  createdAt: '2026-03-23T00:00:00Z',
  updatedAt: '2026-03-27T00:00:00Z',
};

function renderSidebar(role: 'IC' | 'MANAGER' | 'LEADERSHIP') {
  return render(
    <MemoryRouter initialEntries={['/commitments']}>
      <UserContextProvider context={{ accessToken: 'test-token', userId: 'test-user', role, teamId: 'team-test' }}>
        <Sidebar userRole={role} />
      </UserContextProvider>
    </MemoryRouter>,
  );
}

/** Waits for reconciliation nav to finish loading (existing-plan lookup settled + React updated). */
async function waitForReconciliationNavEnabled() {
  await waitFor(() => {
    expect(screen.getByRole('link', { name: /Reconciliation/i })).toBeDefined();
  });
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockGetExistingPlan.mockReset();
    mockGetExistingPlan.mockResolvedValue(mockPlanReconciling);
  });

  it('shows only IC nav items for IC role', async () => {
    renderSidebar('IC');
    expect(screen.getByText('Commitments')).toBeDefined();
    await waitForReconciliationNavEnabled();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.queryByText('Team Dashboard')).toBeNull();
    expect(screen.queryByText('Leadership View')).toBeNull();
    expect(screen.queryByText('RCDO Management')).toBeNull();
  });

  it('shows Team Dashboard and RCDO Management for MANAGER role', async () => {
    renderSidebar('MANAGER');
    await waitForReconciliationNavEnabled();
    expect(screen.getByText('Team Dashboard')).toBeDefined();
    expect(screen.getByText('RCDO Management')).toBeDefined();
    expect(screen.queryByText('Leadership View')).toBeNull();
  });

  it('shows leadership-only nav items without the manager dashboard shortcut', async () => {
    renderSidebar('LEADERSHIP');
    await waitForReconciliationNavEnabled();
    expect(screen.queryByText('Team Dashboard')).toBeNull();
    expect(screen.getByText('Leadership View')).toBeDefined();
    expect(screen.getByText('Executive rollup')).toBeDefined();
    expect(screen.getByText('RCDO Management')).toBeDefined();
  });

  it('renders WCT logo text', async () => {
    renderSidebar('IC');
    await waitForReconciliationNavEnabled();
    expect(screen.getByText('WCT')).toBeDefined();
  });

  it('disables Reconciliation nav when plan is not eligible', async () => {
    mockGetExistingPlan.mockResolvedValue({ ...mockPlanReconciling, status: 'DRAFT' as const });
    renderSidebar('IC');

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Reconciliation/i })).toBeNull();
      expect(
        screen.getByText('Reconciliation').closest('span[aria-disabled="true"]')
      ).not.toBeNull();
    });
  });
});
