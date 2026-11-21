import { createFileRoute, Outlet } from '@tanstack/react-router';

import { redirectIfAuthenticated } from '~/utils/route-guards';

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: () => <Outlet />,
});
