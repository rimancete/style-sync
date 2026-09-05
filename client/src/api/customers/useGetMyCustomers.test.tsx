import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { MOCK_CUSTOMER, createMockAuthResponse } from '~/mocks/auth';
import { useAuthStore } from '~/store/authStore';

import { useGetMyCustomers } from './useGetMyCustomers';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useGetMyCustomers', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore
      .getState()
      .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));
  });

  it('unwraps { data } from GET /api/customers/my-customers', async () => {
    const { result } = renderHook(() => useGetMyCustomers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([MOCK_CUSTOMER]);
    });
  });
});
