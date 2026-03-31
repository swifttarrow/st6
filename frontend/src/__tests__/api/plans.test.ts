import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPlansApi } from '../../api/plans';
import { ApiClient } from '../../api/client';
import { WeeklyPlan, PlanTransition } from '../../api/types';

function createMockClient(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('createPlansApi', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it('getPlan calls GET /api/plans?date=...', async () => {
    const mockPlan: WeeklyPlan = {
      id: 'p1', userId: 'u1', weekStartDate: '2026-03-30',
      status: 'DRAFT', createdAt: '', updatedAt: '',
    };
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);

    const api = createPlansApi(client);
    const result = await api.getPlan('2026-03-30');

    expect(client.get).toHaveBeenCalledWith('/api/plans?date=2026-03-30');
    expect(result).toEqual(mockPlan);
  });

  it('getPlanById calls GET /api/plans/{id}', async () => {
    const api = createPlansApi(client);
    await api.getPlanById('plan-123');
    expect(client.get).toHaveBeenCalledWith('/api/plans/plan-123');
  });

  it('transitionPlan calls POST /api/plans/{id}/transition with body', async () => {
    const api = createPlansApi(client);
    await api.transitionPlan('plan-1', 'ACTIVE');
    expect(client.post).toHaveBeenCalledWith('/api/plans/plan-1/transition', { targetStatus: 'ACTIVE' });
  });

  it('unlockPlan calls POST /api/plans/{id}/unlock', async () => {
    const api = createPlansApi(client);
    await api.unlockPlan('plan-1');
    expect(client.post).toHaveBeenCalledWith('/api/plans/plan-1/unlock');
  });

  it('getTransitions calls GET /api/plans/{id}/transitions', async () => {
    const mockTransitions: PlanTransition[] = [{
      id: 't1', planId: 'p1', fromStatus: null, toStatus: 'DRAFT',
      transitionedBy: 'u1', transitionedAt: '',
    }];
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransitions);

    const api = createPlansApi(client);
    const result = await api.getTransitions('plan-1');

    expect(client.get).toHaveBeenCalledWith('/api/plans/plan-1/transitions');
    expect(result).toEqual(mockTransitions);
  });
});
