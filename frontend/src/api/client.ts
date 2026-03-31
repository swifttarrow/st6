import { HostContext } from '../types/host-context';
import { ApiError } from './types';

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

export function createApiClient(baseUrl: string, userContext: HostContext): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': userContext.userId,
      'X-User-Role': userContext.role,
      'X-Team-Id': userContext.teamId,
    };
    if (userContext.managerId) {
      headers['X-Manager-Id'] = userContext.managerId;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'NetworkError', 'Network request failed');
    }

    if (!response.ok) {
      let errorBody: { error?: string; message?: string } | undefined;
      try {
        errorBody = await response.json() as { error?: string; message?: string };
      } catch {
        throw new ApiError(response.status, response.statusText, `HTTP ${response.status}`);
      }
      throw new ApiError(
        response.status,
        errorBody?.error ?? response.statusText,
        errorBody?.message ?? `HTTP ${response.status}`,
      );
    }

    if (method === 'DELETE') {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    get<T>(path: string): Promise<T> {
      return request<T>('GET', path);
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('POST', path, body);
    },
    put<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('PUT', path, body);
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('PATCH', path, body);
    },
    delete(path: string): Promise<void> {
      return request<void>('DELETE', path);
    },
  };
}
