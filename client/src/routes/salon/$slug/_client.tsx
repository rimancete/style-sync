import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { ClientShell } from '~/components/layout';
import { findCustomerBySlug, useAuthStore } from '~/store/authStore';
import {
  getHomePath,
  getLoginPath,
  replaceSalonSlug,
  salonPath,
  withRedirectQuery,
} from '~/utils/session-paths.util';

import { Route as SalonRoute } from './route';

export const Route = createFileRoute('/salon/$slug/_client')({
  beforeLoad: ({ params, location }) => {
    const session = useAuthStore.getState();

    if (!session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        href: withRedirectQuery(salonPath(params.slug, '/login'), location.href),
      });
    }

    if (session.role !== 'CLIENT') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }

    const linked = findCustomerBySlug(session.customers, params.slug);

    if (!linked) {
      const fallbackSlug = session.activeCustomerSlug ?? session.customers[0]?.urlSlug;

      if (!fallbackSlug) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({ href: getLoginPath(session) });
      }

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: replaceSalonSlug(location.pathname, fallbackSlug) });
    }

    useAuthStore.getState().setActiveCustomer(linked.id);
  },
  component: ClientLayout,
});

function ClientLayout() {
  const salon = SalonRoute.useLoaderData();

  return (
    <ClientShell salon={salon}>
      <Outlet />
    </ClientShell>
  );
}
