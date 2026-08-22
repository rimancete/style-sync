import { useAuthStore, type AuthResponse } from '~/store/authStore';
import { getApiUrl } from '~/utils/env';

import { errorTreatment } from './errorTreatment';

/**
 * The only place in the app that calls `fetch`.
 *
 * Returns the raw `Response` — interpreting the body is `errorTreatment`'s job.
 * On a `401` for an authenticated request it renews the session once and
 * replays the original call, so callers never see the expiry.
 */

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestParams = {
  endpoint: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
};

const HTTP_UNAUTHORIZED = 401;
const LOGIN_PATH = '/login';
const LOGIN_ENDPOINT = '/api/auth/login';
const REFRESH_ENDPOINT = '/api/auth/refresh';

/** Shared across concurrent callers so a burst of 401s triggers a single refresh. */
let inFlightRefresh: Promise<boolean> | null = null;

export function resetRequestState(): void {
  inFlightRefresh = null;
}

export async function request(params: RequestParams): Promise<Response> {
  const response = await executeRequest(params);

  if (!shouldRecoverSession(params.endpoint, response.status)) {
    return response;
  }

  const renewed = await refreshSession();

  if (!renewed) {
    endSession();
    throw new SessionExpiredError();
  }

  return executeRequest(params);
}

/**
 * Renews the session from the stored refresh token, deduplicating concurrent
 * callers. Resolves to `false` when the refresh token is missing or rejected.
 */
export async function refreshSession(): Promise<boolean> {
  inFlightRefresh ??= performRefresh().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

async function executeRequest({ endpoint, method = 'GET', headers, body }: RequestParams) {
  return fetch(resolveUrl(endpoint), {
    method,
    headers: buildHeaders(headers, body),
    body: buildBody(body),
  });
}

async function performRefresh(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(resolveUrl(REFRESH_ENDPOINT), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const auth = await errorTreatment<AuthResponse | null>({ response });

    if (!auth?.token) {
      return false;
    }

    useAuthStore.getState().setSession(auth);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recovery only applies to a request that carried a session. A `401` on the
 * login route is a credential failure, not an expiry, and must not log out.
 */
function shouldRecoverSession(endpoint: string, status: number): boolean {
  if (status !== HTTP_UNAUTHORIZED || isAuthEndpoint(endpoint)) {
    return false;
  }

  return Boolean(useAuthStore.getState().token);
}

function isAuthEndpoint(endpoint: string): boolean {
  const { pathname } = resolveUrl(endpoint);
  return pathname === LOGIN_ENDPOINT || pathname === REFRESH_ENDPOINT;
}

function endSession(): void {
  useAuthStore.getState().clearAuth();
  redirectToLogin();
}

function redirectToLogin(): void {
  if (typeof window === 'undefined' || window.location.pathname === LOGIN_PATH) {
    return;
  }

  window.location.assign(LOGIN_PATH);
}

function resolveUrl(endpoint: string): URL {
  return new URL(endpoint, getApiUrl());
}

function buildHeaders(headers: Record<string, string> | undefined, body: unknown) {
  const { token } = useAuthStore.getState();
  const resolved: Record<string, string> = { Accept: 'application/json' };

  if (!(body instanceof FormData)) {
    resolved['Content-Type'] = 'application/json';
  }

  if (token) {
    resolved.Authorization = `Bearer ${token}`;
  }

  return { ...resolved, ...headers };
}

function buildBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  return body instanceof FormData ? body : JSON.stringify(body);
}
