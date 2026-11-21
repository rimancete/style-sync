import { createFileRoute, Outlet } from '@tanstack/react-router';

import { redirectLegacyUserPath } from '~/utils/route-guards';

export const Route = createFileRoute('/user')({
  beforeLoad: ({ location }) => {
    redirectLegacyUserPath(location);
  },
  component: () => <Outlet />,
});
