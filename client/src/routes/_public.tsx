import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from '~/store';
import { getHomePath } from '~/utils/session-paths.util';

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    const session = useAuthStore.getState();

    if (session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }
  },
  component: () => <Outlet />,
});
