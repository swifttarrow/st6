import { describe, it, expect, vi } from 'vitest';
import type { ApiClient } from '../../api/client';
import { createDashboardApi } from '../../api/dashboard';

describe('createDashboardApi', () => {
  it('builds team overview URL with date and repeated memberIds', async () => {
    const get = vi.fn().mockResolvedValue({});
    const client = { get } as unknown as ApiClient;
    const api = createDashboardApi(client);

    await api.getTeamOverview('2026-04-07', ['alice', 'bob']);

    expect(get).toHaveBeenCalledTimes(1);
    const url = get.mock.calls[0][0] as string;
    expect(url).toContain('/api/dashboard/team?');
    expect(url).toContain('date=2026-04-07');
    expect(url).toMatch(/memberIds=alice/);
    expect(url).toMatch(/memberIds=bob/);
  });

  it('builds org overview URL with date', async () => {
    const get = vi.fn().mockResolvedValue({});
    const client = { get } as unknown as ApiClient;
    const api = createDashboardApi(client);

    await api.getOrgOverview('2026-04-07');

    expect(get).toHaveBeenCalledWith('/api/dashboard/leadership?date=2026-04-07');
  });

  it('builds executive overview URL with date', async () => {
    const get = vi.fn().mockResolvedValue({});
    const client = { get } as unknown as ApiClient;
    const api = createDashboardApi(client);

    await api.getExecutiveOverview('2026-04-07');

    expect(get).toHaveBeenCalledWith('/api/dashboard/executive?date=2026-04-07');
  });
});
