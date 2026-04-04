import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient } from '../../api/client';
import { ApiError } from '../../api/types';
import { HostContext } from '../../types/host-context';

const mockContext: HostContext = {
  accessToken: 'test-jwt-token',
  userId: 'user-1',
  role: 'IC',
  teamId: 'team-1',
  managerId: 'mgr-1',
  directReportIds: ['alice', 'bob'],
};

const BASE_URL = 'http://localhost:8080';

function mockFetchResponse(body: unknown, status = 200): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  }));
}

function mockFetchNetworkError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
}

function mockFetchNonJsonError(status: number): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new Error('not json')),
  }));
}

describe('createApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends bearer auth for authenticated requests', async () => {
    mockFetchResponse({ data: 'ok' });
    const client = createApiClient(BASE_URL, mockContext);
    await client.get('/api/test');

    const fetchFn = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(fetchFn).toHaveBeenCalledOnce();
    const [, options] = fetchFn.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws when accessToken is missing', () => {
    expect(() => createApiClient(BASE_URL, {
      userId: 'u1',
      role: 'IC',
      teamId: 't1',
      accessToken: '   ',
    })).toThrow('HostContext.accessToken is required for authenticated API requests');
  });

  it('prepends base URL to the path', async () => {
    mockFetchResponse({});
    const client = createApiClient(BASE_URL, mockContext);
    await client.get('/api/plans');

    const fetchFn = globalThis.fetch as ReturnType<typeof vi.fn>;
    const [url] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/plans');
  });

  it('parses JSON response on success', async () => {
    const expected = { id: '123', name: 'test' };
    mockFetchResponse(expected);
    const client = createApiClient(BASE_URL, mockContext);
    const result = await client.get<{ id: string; name: string }>('/api/test');
    expect(result).toEqual(expected);
  });

  it('sends POST with JSON body', async () => {
    mockFetchResponse({ id: '1' });
    const client = createApiClient(BASE_URL, mockContext);
    await client.post('/api/items', { title: 'hello' });

    const fetchFn = globalThis.fetch as ReturnType<typeof vi.fn>;
    const [, options] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ title: 'hello' }));
  });

  it('throws ApiError on non-2xx with JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'ValidationError', message: 'Invalid input' }),
    }));

    const client = createApiClient(BASE_URL, mockContext);
    try {
      await client.get('/api/fail');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.error).toBe('ValidationError');
      expect(apiErr.message).toBe('Invalid input');
    }
  });

  it('throws ApiError on non-JSON error response', async () => {
    mockFetchNonJsonError(500);
    const client = createApiClient(BASE_URL, mockContext);

    try {
      await client.get('/api/fail');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.message).toBe('HTTP 500');
    }
  });

  it('throws ApiError with status 0 on network error', async () => {
    mockFetchNetworkError();
    const client = createApiClient(BASE_URL, mockContext);

    try {
      await client.get('/api/fail');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.message).toBe('Network request failed');
    }
  });

  it('DELETE returns void', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.resolve(undefined),
    }));
    const client = createApiClient(BASE_URL, mockContext);
    const result = await client.delete('/api/items/1');
    expect(result).toBeUndefined();
  });
});
