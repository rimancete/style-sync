import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { request, resetRequestState, SessionExpiredError } from '~/hooks/utils/request';
import { createMockAuthResponse } from '~/mocks/auth';
import { useAuthStore } from '~/store/authStore';

const API_URL = 'http://localhost:3001';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function seedSession(): ReturnType<typeof createMockAuthResponse> {
  const auth = createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' });
  useAuthStore.getState().setSession(auth);
  return auth;
}

function headersOf(init: RequestInit | undefined): Record<string, string> {
  const headers = init?.headers;

  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    throw new Error('Expected a headers record');
  }

  return headers;
}

function hrefOf(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.href;
  }

  if (typeof input === 'string') {
    return input;
  }

  return input.url;
}

describe('request', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    resetRequestState();
    useAuthStore.getState().clearAuth();
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    resetRequestState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves the URL against http://localhost:3001 by default', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    await request({ endpoint: '/api/health' });

    expect(hrefOf(fetchMock.mock.calls[0][0])).toBe(`${API_URL}/api/health`);
  });

  it('injects Authorization when a session token is present', async () => {
    const auth = seedSession();
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await request({ endpoint: '/api/salon/stylesync/branches' });

    expect(headersOf(fetchMock.mock.calls[0][1]).Authorization).toBe(`Bearer ${auth.token}`);
  });

  it('refreshes once on 401 and retries the original request', async () => {
    const auth = seedSession();
    const renewed = createMockAuthResponse({
      email: 'client@test.com',
      role: 'CLIENT',
      userId: 'renewed-user',
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status: 401, message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: renewed }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const response = await request({ endpoint: '/api/salon/stylesync/branches' });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(hrefOf(fetchMock.mock.calls[1][0])).toBe(`${API_URL}/api/auth/refresh`);
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
    expect(headersOf(fetchMock.mock.calls[1][1]).Authorization).toBe(`Bearer ${auth.refreshToken}`);
    expect(hrefOf(fetchMock.mock.calls[2][0])).toBe(`${API_URL}/api/salon/stylesync/branches`);
    expect(useAuthStore.getState().userId).toBe('renewed-user');
  });

  it('deduplicates concurrent 401s into a single refresh call', async () => {
    seedSession();
    const renewed = createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' });
    let refreshCalls = 0;
    const attempts = new Map<string, number>();

    fetchMock.mockImplementation((input) => {
      const url = hrefOf(input);

      if (url.endsWith('/api/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse({ data: renewed }));
      }

      const attempt = (attempts.get(url) ?? 0) + 1;
      attempts.set(url, attempt);

      if (attempt === 1) {
        return Promise.resolve(jsonResponse({ status: 401, message: 'Unauthorized' }, 401));
      }

      return Promise.resolve(jsonResponse({ data: { ok: true } }));
    });

    const [first, second, third] = await Promise.all([
      request({ endpoint: '/api/first' }),
      request({ endpoint: '/api/second' }),
      request({ endpoint: '/api/third' }),
    ]);

    expect(refreshCalls).toBe(1);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
  });

  it('clears the session and throws SessionExpiredError when refresh fails', async () => {
    seedSession();
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/admin', assign });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status: 401, message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ status: 401, message: 'Invalid refresh token' }, 401));

    await expect(request({ endpoint: '/api/salon/stylesync/branches' })).rejects.toBeInstanceOf(
      SessionExpiredError
    );

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does not refresh or log out on a 401 from the login endpoint', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/login', assign });

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 401, message: 'Invalid credentials' }, 401)
    );

    const response = await request({
      endpoint: '/api/auth/login',
      method: 'POST',
      body: { email: 'a@b.c', password: 'wrong' },
    });

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
