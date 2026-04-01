import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrategyManagementPage } from '../../pages/StrategyManagement/StrategyManagementPage';

const mockTree = [
  {
    id: 'rc-1',
    name: 'Revenue Growth',
    description: 'Top-line revenue',
    archived: false,
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Enterprise Pipeline',
        description: 'Increase enterprise deals',
        archived: false,
        outcomes: [
          { id: 'oc-1', name: 'Close 5 deals', description: 'Close enterprise deals', archived: false },
        ],
      },
    ],
  },
  {
    id: 'rc-2',
    name: 'Customer Retention',
    description: 'Reduce churn',
    archived: false,
    definingObjectives: [],
  },
];

const mockApi = {
  rcdo: {
    getTree: vi.fn().mockResolvedValue(mockTree),
    searchOutcomes: vi.fn(),
    createRallyCry: vi.fn().mockResolvedValue({}),
    updateRallyCry: vi.fn().mockResolvedValue({}),
    archiveRallyCry: vi.fn().mockResolvedValue({}),
    unarchiveRallyCry: vi.fn().mockResolvedValue({}),
    createDefiningObjective: vi.fn().mockResolvedValue({}),
    updateDefiningObjective: vi.fn().mockResolvedValue({}),
    archiveDefiningObjective: vi.fn().mockResolvedValue({}),
    unarchiveDefiningObjective: vi.fn().mockResolvedValue({}),
    createOutcome: vi.fn().mockResolvedValue({}),
    updateOutcome: vi.fn().mockResolvedValue({}),
    archiveOutcome: vi.fn().mockResolvedValue({}),
    unarchiveOutcome: vi.fn().mockResolvedValue({}),
  },
  plans: { getPlan: vi.fn(), getPlanById: vi.fn(), transitionPlan: vi.fn(), unlockPlan: vi.fn(), getTransitions: vi.fn() },
  commitments: { listCommitments: vi.fn(), createCommitment: vi.fn(), updateCommitment: vi.fn(), deleteCommitment: vi.fn(), reorderCommitments: vi.fn(), reconcileCommitment: vi.fn(), bulkReconcile: vi.fn() },
  dashboard: { getTeamOverview: vi.fn(), getOrgOverview: vi.fn() },
};

let mockRole = 'MANAGER';

vi.mock('../../context/ApiContext', () => ({
  useApi: () => mockApi,
}));

vi.mock('../../context/UserContext', () => ({
  useUserContext: () => ({
    userId: 'user-1',
    role: mockRole,
    teamId: 'team-1',
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/strategy']}>
      <StrategyManagementPage />
    </MemoryRouter>,
  );
}

describe('StrategyManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'MANAGER';
    mockApi.rcdo.getTree.mockResolvedValue(mockTree);
  });

  // ── Role guard ──

  it('redirects IC users away from the page', () => {
    mockRole = 'IC';
    renderPage();
    expect(screen.queryByTestId('strategy-management')).toBeNull();
  });

  it('renders the page for MANAGER role', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('strategy-management')).toBeDefined();
    });
  });

  it('renders the page for LEADERSHIP role', async () => {
    mockRole = 'LEADERSHIP';
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('strategy-management')).toBeDefined();
    });
  });

  // ── Tree rendering ──

  it('displays Rally Cry names', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Revenue Growth')).toBeDefined();
      expect(screen.getByText('Customer Retention')).toBeDefined();
    });
  });

  it('displays Defining Objectives nested under Rally Cries', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Enterprise Pipeline')).toBeDefined();
    });
  });

  it('displays Outcomes nested under Defining Objectives', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Close 5 deals')).toBeDefined();
    });
  });

  // ── Create Rally Cry ──

  it('shows New Rally Cry button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('create-rally-cry-btn')).toBeDefined();
    });
  });

  it('clicking New Rally Cry shows the create modal', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('create-rally-cry-btn'));
    fireEvent.click(screen.getByTestId('create-rally-cry-btn'));
    expect(screen.getByTestId('create-rally-cry-modal')).toBeDefined();
  });

  it('Create Rally Cry submit is disabled when name is empty', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('create-rally-cry-btn'));
    fireEvent.click(screen.getByTestId('create-rally-cry-btn'));
    const createBtn = screen.getByTestId('create-rally-cry-submit');
    expect((createBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('submitting create Rally Cry calls API and refetches tree', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('create-rally-cry-btn'));
    fireEvent.click(screen.getByTestId('create-rally-cry-btn'));

    const nameInput = screen.getByPlaceholderText('e.g. Revenue Growth');
    fireEvent.change(nameInput, { target: { value: 'New RC' } });
    fireEvent.click(screen.getByTestId('create-rally-cry-submit'));

    await waitFor(() => {
      expect(mockApi.rcdo.createRallyCry).toHaveBeenCalledWith({ name: 'New RC', description: '' });
    });
    expect(mockApi.rcdo.getTree).toHaveBeenCalledTimes(2); // initial + after create
  });

  // ── Create Defining Objective ──

  it('shows Add Objective buttons on Rally Cry nodes', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByTestId('add-do-btn').length).toBeGreaterThan(0);
    });
  });

  it('submitting create DO calls API with correct rallyCryId', async () => {
    renderPage();
    await waitFor(() => screen.getAllByTestId('add-do-btn'));
    fireEvent.click(screen.getAllByTestId('add-do-btn')[0]);
    expect(screen.getByTestId('create-do-modal')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('e.g. Increase enterprise pipeline'), { target: { value: 'New DO' } });
    fireEvent.click(screen.getByTestId('create-do-submit'));

    await waitFor(() => {
      expect(mockApi.rcdo.createDefiningObjective).toHaveBeenCalledWith({
        rallyCryId: 'rc-1',
        name: 'New DO',
        description: '',
      });
    });
  });

  // ── Create Outcome ──

  it('shows Add Outcome buttons on DO nodes', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByTestId('add-outcome-btn').length).toBeGreaterThan(0);
    });
  });

  it('submitting create Outcome calls API with correct definingObjectiveId', async () => {
    renderPage();
    await waitFor(() => screen.getAllByTestId('add-outcome-btn'));
    fireEvent.click(screen.getAllByTestId('add-outcome-btn')[0]);
    expect(screen.getByTestId('create-outcome-modal')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('e.g. Close 5 enterprise deals by Q2'), { target: { value: 'New OC' } });
    fireEvent.click(screen.getByTestId('create-outcome-submit'));

    await waitFor(() => {
      expect(mockApi.rcdo.createOutcome).toHaveBeenCalledWith({
        definingObjectiveId: 'do-1',
        name: 'New OC',
        description: '',
      });
    });
  });

  // ── Form exclusivity ──

  it('opening DO modal closes RC modal', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('create-rally-cry-btn'));
    fireEvent.click(screen.getByTestId('create-rally-cry-btn'));
    expect(screen.getByTestId('create-rally-cry-modal')).toBeDefined();

    fireEvent.click(screen.getAllByTestId('add-do-btn')[0]);
    expect(screen.queryByTestId('create-rally-cry-modal')).toBeNull();
    expect(screen.getByTestId('create-do-modal')).toBeDefined();
  });

  // ── Edit ──

  it('clicking edit shows inline inputs', async () => {
    renderPage();
    await waitFor(() => screen.getAllByTestId('edit-node-btn'));
    fireEvent.click(screen.getAllByTestId('edit-node-btn')[0]);
    expect(screen.getByTestId('inline-edit-name')).toBeDefined();
  });

  it('saving edit calls the correct update method', async () => {
    renderPage();
    await waitFor(() => screen.getAllByTestId('edit-node-btn'));
    fireEvent.click(screen.getAllByTestId('edit-node-btn')[0]);

    const nameInput = screen.getByTestId('inline-edit-name');
    fireEvent.change(nameInput, { target: { value: 'Updated RC' } });
    fireEvent.click(screen.getAllByText('Save')[0]);

    await waitFor(() => {
      expect(mockApi.rcdo.updateRallyCry).toHaveBeenCalledWith('rc-1', { name: 'Updated RC', description: 'Top-line revenue' });
    });
  });

  it('only one node can be in edit mode at a time', async () => {
    renderPage();
    await waitFor(() => screen.getAllByTestId('edit-node-btn'));
    const editBtns = screen.getAllByTestId('edit-node-btn');
    fireEvent.click(editBtns[0]);
    expect(screen.getByTestId('inline-edit-name')).toBeDefined();

    // While RC is in inline edit, the next edit-node-btn in document order is the DO row
    fireEvent.click(screen.getAllByTestId('edit-node-btn')[0]);

    expect((screen.getByTestId('inline-edit-name') as HTMLInputElement).value).toBe('Enterprise Pipeline');
  });

  // ── Archive ──

  it('clicking archive shows confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await waitFor(() => screen.getAllByTestId('archive-node-btn'));
    fireEvent.click(screen.getAllByTestId('archive-node-btn')[0]);
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('confirming archive calls the correct method', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await waitFor(() => screen.getAllByTestId('archive-node-btn'));
    fireEvent.click(screen.getAllByTestId('archive-node-btn')[0]);

    await waitFor(() => {
      expect(mockApi.rcdo.archiveRallyCry).toHaveBeenCalledWith('rc-1');
    });
    confirmSpy.mockRestore();
  });

  // ── Show Archived Toggle ──

  it('show archived toggle fetches tree with includeArchived=true', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('show-archived-toggle'));
    const checkbox = screen.getByTestId('show-archived-toggle').querySelector('input')!;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockApi.rcdo.getTree).toHaveBeenCalledWith(true);
    });
  });

  // ── Error handling ──

  it('API error during creation shows ErrorToast', async () => {
    mockApi.rcdo.createRallyCry.mockRejectedValueOnce(new Error('Server error'));
    renderPage();
    await waitFor(() => screen.getByTestId('create-rally-cry-btn'));
    fireEvent.click(screen.getByTestId('create-rally-cry-btn'));

    fireEvent.change(screen.getByPlaceholderText('e.g. Revenue Growth'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByTestId('create-rally-cry-submit'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeDefined();
    });
  });
});
