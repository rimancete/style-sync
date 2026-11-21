import { createFileRoute, Outlet } from '@tanstack/react-router';

import { ClientShell } from '~/components/layout';
import { requireClientSalonSession } from '~/utils/route-guards';

import { Route as SalonRoute } from './route';

export const Route = createFileRoute('/salon/$slug/_client')({
  beforeLoad: ({ params, location }) => {
    requireClientSalonSession(params, location);
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
