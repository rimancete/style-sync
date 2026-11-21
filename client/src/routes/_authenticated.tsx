import { createFileRoute, Outlet } from '@tanstack/react-router';

import { requireAuthenticatedSession } from '~/utils/route-guards';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    requireAuthenticatedSession(location);
  },
  component: () => <Outlet />,
});
