import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from '~/store/authStore';
import {
  getHomePath,
  getLoginPath,
  salonPath,
  withRedirectQuery,
} from '~/utils/session-paths.util';

export const Route = createFileRoute('/user')({
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState();

    if (!session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        href: withRedirectQuery(getLoginPath(session), location.href),
      });
    }

    if (session.role === 'CLIENT' && session.activeCustomerSlug) {
      const suffix = location.pathname.slice('/user'.length);
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        href: salonPath(session.activeCustomerSlug, `/user${suffix}`),
      });
    }

    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ href: getHomePath(session) });
  },
  component: () => <Outlet />,
});
