import { createRouter, type RouterHistory } from '@tanstack/react-router';

import type { RouterContext } from './router-context';
import { routeTree } from './routeTree.gen';

export type { RouterContext } from './router-context';

type CreateAppRouterParams = RouterContext & {
  history?: RouterHistory;
};

export function createAppRouter({ queryClient, history }: CreateAppRouterParams) {
  return createRouter({
    routeTree,
    context: { queryClient },
    history,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
