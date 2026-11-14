import { createFileRoute, redirect } from '@tanstack/react-router';

import { useAuthStore } from '~/store/authStore';
import { getHomePath } from '~/utils/session-paths.util';

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState();

    if (!session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ href: getHomePath(session) });
  },
  component: () => null,
});
