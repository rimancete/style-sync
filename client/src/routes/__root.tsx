import { useEffect, useState } from 'react';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useTranslation } from 'react-i18next';

import { restoreSession } from '~/hooks/utils/restoreSession';

import type { RouterContext } from '~/router-context';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const { t } = useTranslation();
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
    return (
      <div
        className="text-muted-foreground flex min-h-screen items-center justify-center"
        role="status"
      >
        {t('common.loading')}
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}
