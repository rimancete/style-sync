import { useAuthStore } from '~/store/authStore';
import { isTokenExpired } from '~/utils/jwt.util';

import { refreshSession } from './request';

/**
 * Renews a persisted-but-expired session before the app issues its first
 * authenticated request, so a returning user never sees the login screen flash.
 */
export async function restoreSession(): Promise<void> {
  await waitForAuthHydration();

  const { token, refreshToken } = useAuthStore.getState();

  if (!token) {
    return;
  }

  if (!isTokenExpired(token)) {
    return;
  }

  if (refreshToken && !isTokenExpired(refreshToken) && (await refreshSession())) {
    return;
  }

  useAuthStore.getState().clearAuth();
}

/**
 * Zustand persist hydrates from localStorage asynchronously. Reading the
 * session before that finishes treats a returning user as logged out.
 */
function waitForAuthHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });

    if (useAuthStore.persist.hasHydrated()) {
      unsub();
      resolve();
    }
  });
}
