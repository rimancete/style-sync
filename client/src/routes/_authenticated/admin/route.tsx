import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from '~/store';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: () => {
    if (useAuthStore.getState().role !== 'ADMIN') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/' });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
