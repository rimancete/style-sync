import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '~/store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
