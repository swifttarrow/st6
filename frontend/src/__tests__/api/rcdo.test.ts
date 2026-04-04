import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRcdoApi } from '../../api/rcdo';
import { ApiClient } from '../../api/client';

function createMockClient(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('createRcdoApi', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = createMockClient();
  });

  // ── getTree ──

  it('getTree() calls GET /api/rcdo/tree', async () => {
    const api = createRcdoApi(client);
    await api.getTree();
    expect(client.get).toHaveBeenCalledWith('/api/rcdo/tree');
  });

  it('getTree(true) calls GET /api/rcdo/tree?includeArchived=true', async () => {
    const api = createRcdoApi(client);
    await api.getTree(true);
    expect(client.get).toHaveBeenCalledWith('/api/rcdo/tree?includeArchived=true');
  });

  it('getTree(false) calls GET /api/rcdo/tree', async () => {
    const api = createRcdoApi(client);
    await api.getTree(false);
    expect(client.get).toHaveBeenCalledWith('/api/rcdo/tree');
  });

  it('searchOutcomes encodes query in the path', async () => {
    const api = createRcdoApi(client);
    await api.searchOutcomes('foo bar');
    expect(client.get).toHaveBeenCalledWith(
      `/api/rcdo/outcomes/search?q=${encodeURIComponent('foo bar')}`,
    );
  });

  // ── Rally Cry mutations ──

  it('createRallyCry sends POST with body', async () => {
    const api = createRcdoApi(client);
    await api.createRallyCry({ name: 'RC1', description: 'desc' });
    expect(client.post).toHaveBeenCalledWith('/api/rcdo/rally-cries', { name: 'RC1', description: 'desc' });
  });

  it('updateRallyCry sends PUT to correct path', async () => {
    const api = createRcdoApi(client);
    await api.updateRallyCry('rc-1', { name: 'Updated', description: 'new desc' });
    expect(client.put).toHaveBeenCalledWith('/api/rcdo/rally-cries/rc-1', { name: 'Updated', description: 'new desc' });
  });

  it('archiveRallyCry sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.archiveRallyCry('rc-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/rally-cries/rc-1/archive');
  });

  it('unarchiveRallyCry sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.unarchiveRallyCry('rc-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/rally-cries/rc-1/unarchive');
  });

  // ── Defining Objective mutations ──

  it('createDefiningObjective sends POST with rallyCryId', async () => {
    const api = createRcdoApi(client);
    await api.createDefiningObjective({ rallyCryId: 'rc-1', name: 'DO1', description: 'desc' });
    expect(client.post).toHaveBeenCalledWith('/api/rcdo/defining-objectives', { rallyCryId: 'rc-1', name: 'DO1', description: 'desc' });
  });

  it('updateDefiningObjective sends PUT to correct path', async () => {
    const api = createRcdoApi(client);
    await api.updateDefiningObjective('do-1', { name: 'Updated', description: '' });
    expect(client.put).toHaveBeenCalledWith('/api/rcdo/defining-objectives/do-1', { name: 'Updated', description: '' });
  });

  it('archiveDefiningObjective sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.archiveDefiningObjective('do-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/defining-objectives/do-1/archive');
  });

  it('unarchiveDefiningObjective sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.unarchiveDefiningObjective('do-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/defining-objectives/do-1/unarchive');
  });

  // ── Outcome mutations ──

  it('createOutcome sends POST with definingObjectiveId', async () => {
    const api = createRcdoApi(client);
    await api.createOutcome({ definingObjectiveId: 'do-1', name: 'OC1', description: 'desc' });
    expect(client.post).toHaveBeenCalledWith('/api/rcdo/outcomes', { definingObjectiveId: 'do-1', name: 'OC1', description: 'desc' });
  });

  it('updateOutcome sends PUT to correct path', async () => {
    const api = createRcdoApi(client);
    await api.updateOutcome('oc-1', { name: 'Updated', description: '' });
    expect(client.put).toHaveBeenCalledWith('/api/rcdo/outcomes/oc-1', { name: 'Updated', description: '' });
  });

  it('archiveOutcome sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.archiveOutcome('oc-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/outcomes/oc-1/archive');
  });

  it('unarchiveOutcome sends PATCH to correct path', async () => {
    const api = createRcdoApi(client);
    await api.unarchiveOutcome('oc-1');
    expect(client.patch).toHaveBeenCalledWith('/api/rcdo/outcomes/oc-1/unarchive');
  });
});
