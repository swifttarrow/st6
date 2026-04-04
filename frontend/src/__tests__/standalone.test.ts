import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../index', () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

describe('standalone bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    delete (window as unknown as { __WCT_HOST_CONTEXT__?: unknown }).__WCT_HOST_CONTEXT__;
  });

  it('renders host context error when context is missing', async () => {
    const { mount } = await import('../index');
    vi.mocked(mount).mockClear();

    await import('../standalone');

    expect(document.getElementById('app')?.innerHTML).toContain('Host Context Required');
    expect(mount).not.toHaveBeenCalled();
  });

  it('calls mount with normalized context when valid', async () => {
    (window as unknown as { __WCT_HOST_CONTEXT__: Record<string, unknown> }).__WCT_HOST_CONTEXT__ = {
      accessToken: '  tok  ',
      userId: ' uid ',
      teamId: ' tid ',
      role: 'MANAGER',
      managerId: '  mgr ',
      directReportIds: ['  a  ', '', 1, 'b'],
    };

    const { mount } = await import('../index');
    vi.mocked(mount).mockClear();

    await import('../standalone');

    expect(mount).toHaveBeenCalledTimes(1);
    const [, ctx] = vi.mocked(mount).mock.calls[0];
    expect(ctx).toMatchObject({
      accessToken: 'tok',
      userId: 'uid',
      teamId: 'tid',
      role: 'MANAGER',
      managerId: 'mgr',
      directReportIds: ['  a  ', 'b'],
    });
  });

  it('renders error for invalid role', async () => {
    (window as unknown as { __WCT_HOST_CONTEXT__: Record<string, unknown> }).__WCT_HOST_CONTEXT__ = {
      accessToken: 'a',
      userId: 'u',
      teamId: 't',
      role: 'GUEST',
    };

    const { mount } = await import('../index');
    vi.mocked(mount).mockClear();

    await import('../standalone');

    expect(document.getElementById('app')?.innerHTML).toContain('Host Context Required');
    expect(mount).not.toHaveBeenCalled();
  });
});
