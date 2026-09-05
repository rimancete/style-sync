import { afterEach } from 'vitest';
import { setupServer } from 'msw/node';

import { useAuthStore } from '~/store/authStore';

import { handlers } from './handlers';

export const server = setupServer(...handlers);

afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearAuth();
  localStorage.clear();
});
