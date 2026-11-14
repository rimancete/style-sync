import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from '~/store';
import { getLoginPath, withRedirectQuery } from '~/utils/session-paths.util';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState();

    if (!session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        href: withRedirectQuery(getLoginPath(session), location.href),
      });
    }
  },
  component: () => <Outlet />,
});
