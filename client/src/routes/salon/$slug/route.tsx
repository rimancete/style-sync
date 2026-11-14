import { useLayoutEffect } from 'react';
import { createFileRoute, isNotFound, notFound, Outlet } from '@tanstack/react-router';

import { api } from '~/api';
import { applyCustomerBranding, resetCustomerBranding } from '~/lib/theme/tenantTheme';
import { SalonNotFoundScreen } from '~/screens/SalonNotFound';

export const Route = createFileRoute('/salon/$slug')({
  loader: async ({ context, params }) => {
    try {
      const branding = await context.queryClient.ensureQueryData(
        api.customers.brandingQueryOptions(params.slug)
      );

      if (!branding.isActive) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw notFound();
      }

      return branding;
    } catch (error) {
      if (isNotFound(error)) {
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound();
    }
  },
  notFoundComponent: SalonNotFoundScreen,
  component: SalonLayout,
});

function SalonLayout() {
  const branding = Route.useLoaderData();

  useLayoutEffect(() => {
    applyCustomerBranding(branding);
    return () => {
      resetCustomerBranding();
    };
  }, [branding]);

  return <Outlet />;
}
