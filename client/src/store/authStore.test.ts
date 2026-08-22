import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAuthResponse } from '~/mocks/auth';
import { createUnsignedJwt } from '~/mocks/jwt';
import { useAuthStore } from '~/store/authStore';
import { getAuthStorageKey } from '~/utils/env';

const STORAGE_KEY = getAuthStorageKey();

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it('maps AuthResponse into session fields and derives email and role from the JWT', () => {
    const auth = createMockAuthResponse({
      email: 'admin@stylesync.com',
      role: 'ADMIN',
      userName: 'Admin User',
    });

    useAuthStore.getState().setSession(auth);

    const session = useAuthStore.getState();
    expect(session.token).toBe(auth.token);
    expect(session.refreshToken).toBe(auth.refreshToken);
    expect(session.userId).toBe(auth.userId);
    expect(session.userName).toBe('Admin User');
    expect(session.phone).toBeNull();
    expect(session.customers).toEqual(auth.customers);
    expect(session.defaultCustomerId).toBe(auth.defaultCustomerId);
    expect(session.email).toBe('admin@stylesync.com');
    expect(session.role).toBe('ADMIN');
    expect(session.isAuthenticated).toBe(true);
  });

  it('leaves role null when the JWT has no recognised role', () => {
    const token = createUnsignedJwt({
      sub: 'user-1',
      email: 'a@b.c',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const auth = createMockAuthResponse({ email: 'a@b.c', role: 'CLIENT' });

    useAuthStore.getState().setSession({ ...auth, token });

    expect(useAuthStore.getState().role).toBeNull();
    expect(useAuthStore.getState().email).toBe('a@b.c');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('replaces only the tokens on setTokens', () => {
    const auth = createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' });
    useAuthStore.getState().setSession(auth);

    useAuthStore.getState().setTokens({ token: 'next-access', refreshToken: 'next-refresh' });

    const session = useAuthStore.getState();
    expect(session.token).toBe('next-access');
    expect(session.refreshToken).toBe('next-refresh');
    expect(session.userId).toBe(auth.userId);
    expect(session.isAuthenticated).toBe(true);
  });

  it('clears every persisted field on clearAuth', () => {
    useAuthStore
      .getState()
      .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

    useAuthStore.getState().clearAuth();

    const session = useAuthStore.getState();
    expect(session.token).toBeNull();
    expect(session.refreshToken).toBeNull();
    expect(session.userId).toBeNull();
    expect(session.role).toBeNull();
    expect(session.customers).toEqual([]);
    expect(session.isAuthenticated).toBe(false);
  });

  it('discards a persisted session in the previous { user, token } shape', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          user: { id: '1', email: 'old@test.com', name: 'Old', role: 'admin' },
          token: 'legacy-token',
          isAuthenticated: true,
        },
        version: 0,
      })
    );

    await useAuthStore.persist.rehydrate();

    const session = useAuthStore.getState();
    expect(session.isAuthenticated).toBe(false);
    expect(session.token).toBeNull();
    expect(session.userId).toBeNull();
  });
});
