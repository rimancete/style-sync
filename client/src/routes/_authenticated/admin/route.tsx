import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { AdminShell } from '~/components/layout';
import { useAuthStore } from '~/store';
import { getHomePath, SELECT_COMPANY_PATH, withRedirectQuery } from '~/utils/session-paths.util';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState();

    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }

    if (!session.activeCustomerId) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        href: withRedirectQuery(SELECT_COMPANY_PATH, location.href),
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
