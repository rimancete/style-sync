import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUnsignedJwt } from '~/mocks/jwt';
import { useAuthStore } from '~/store/authStore';

import { refreshSession } from './request';
import { restoreSession } from './restoreSession';

vi.mock('./request', () => ({
  refreshSession: vi.fn(),
}));

const mockedRefresh = vi.mocked(refreshSession);

type HydrationListener = Parameters<typeof useAuthStore.persist.onFinishHydration>[0];

const ONE_HOUR_IN_SECONDS = 60 * 60;

function expiredJwt(): string {
  return createUnsignedJwt({
    exp: Math.floor(Date.now() / 1000) - ONE_HOUR_IN_SECONDS,
  });
}

function validJwt(): string {
  return createUnsignedJwt({
    exp: Math.floor(Date.now() / 1000) + ONE_HOUR_IN_SECONDS,
  });
}

describe('restoreSession', () => {
  beforeEach(() => {
    mockedRefresh.mockReset();
    mockedRefresh.mockResolvedValue(true);
    useAuthStore.getState().clearAuth();
    vi.spyOn(useAuthStore.persist, 'hasHydrated').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not refresh when the access token is still valid', async () => {
    useAuthStore.setState({
      token: validJwt(),
      refreshToken: validJwt(),
      isAuthenticated: true,
    });

    await restoreSession();

    expect(mockedRefresh).not.toHaveBeenCalled();
  });

  it('refreshes when the persisted access token is expired', async () => {
    useAuthStore.setState({
      token: expiredJwt(),
      refreshToken: validJwt(),
      isAuthenticated: true,
    });

    await restoreSession();

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });

  it('waits for persist hydration before reading the session', async () => {
    let hydrated = false;
    const listeners: HydrationListener[] = [];

    vi.spyOn(useAuthStore.persist, 'hasHydrated').mockImplementation(() => hydrated);
    vi.spyOn(useAuthStore.persist, 'onFinishHydration').mockImplementation((listener) => {
      listeners.push(listener);
      return () => undefined;
    });

    const pending = restoreSession();

    await Promise.resolve();
    expect(mockedRefresh).not.toHaveBeenCalled();

    useAuthStore.setState({
      token: expiredJwt(),
      refreshToken: validJwt(),
      isAuthenticated: true,
    });
    hydrated = true;
    listeners.forEach((listener) => listener(useAuthStore.getState()));

    await pending;

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });
});
