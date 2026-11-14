import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

import { Toaster } from '~/components/ui/toaster';
import { createAppRouter } from '~/router';

import { createTestQueryClient } from './utils';

/** Renders the whole app at `initialPath` and waits for the session restore to finish. */
export async function renderApp(initialPath: string) {
  const queryClient = createTestQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  return { ...view, router, queryClient };
}
