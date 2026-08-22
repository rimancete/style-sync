import { useEffect, useState } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { restoreSession } from '~/hooks/utils/restoreSession';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void restoreSession().finally(() => {
      if (isCurrent) {
        setIsRestoringSession(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Holding the first paint keeps a returning user with an expired access token
  // from seeing the login screen while the refresh is in flight.
  if (isRestoringSession) {
    return null;
  }

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}
