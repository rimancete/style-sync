import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '~/store';

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
