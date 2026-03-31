import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCommitmentsApi } from '../../api/commitments';
import { ApiClient } from '../../api/client';

function createMockClient(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('createCommitmentsApi', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it('listCommitments calls GET /api/plans/{planId}/commitments', async () => {
    const api = createCommitmentsApi(client);
    await api.listCommitments('plan-1');
    expect(client.get).toHaveBeenCalledWith('/api/plans/plan-1/commitments');
  });

  it('createCommitment calls POST /api/plans/{planId}/commitments', async () => {
    const api = createCommitmentsApi(client);
    await api.createCommitment('plan-1', { outcomeId: 'o1', title: 'Do thing' });
    expect(client.post).toHaveBeenCalledWith('/api/plans/plan-1/commitments', { outcomeId: 'o1', title: 'Do thing' });
  });

  it('updateCommitment calls PUT /api/plans/{planId}/commitments/{id}', async () => {
    const api = createCommitmentsApi(client);
    await api.updateCommitment('plan-1', 'c1', { title: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/api/plans/plan-1/commitments/c1', { title: 'Updated' });
  });

  it('deleteCommitment calls DELETE /api/plans/{planId}/commitments/{id}', async () => {
    const api = createCommitmentsApi(client);
    await api.deleteCommitment('plan-1', 'c1');
    expect(client.delete).toHaveBeenCalledWith('/api/plans/plan-1/commitments/c1');
  });

  it('reorderCommitments calls PUT with orderedCommitmentIds', async () => {
    const api = createCommitmentsApi(client);
    await api.reorderCommitments('plan-1', ['c2', 'c1', 'c3']);
    expect(client.put).toHaveBeenCalledWith('/api/plans/plan-1/commitments/reorder', {
      orderedCommitmentIds: ['c2', 'c1', 'c3'],
    });
  });

  it('reconcileCommitment calls PATCH /api/plans/{planId}/commitments/{id}/reconcile', async () => {
    const api = createCommitmentsApi(client);
    await api.reconcileCommitment('plan-1', 'c1', { commitmentId: 'c1', actualStatus: 'DONE' });
    expect(client.patch).toHaveBeenCalledWith('/api/plans/plan-1/commitments/c1/reconcile', {
      commitmentId: 'c1',
      actualStatus: 'DONE',
    });
  });

  it('bulkReconcile calls PATCH /api/plans/{planId}/commitments/reconcile', async () => {
    const items = [
      { commitmentId: 'c1', actualStatus: 'DONE' as const },
      { commitmentId: 'c2', actualStatus: 'MISSED' as const },
    ];
    const api = createCommitmentsApi(client);
    await api.bulkReconcile('plan-1', items);
    expect(client.patch).toHaveBeenCalledWith('/api/plans/plan-1/commitments/reconcile', { items });
  });
});
