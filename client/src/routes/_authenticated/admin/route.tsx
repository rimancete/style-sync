import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AdminShell } from '~/components/layout';
import { requireActiveCompany } from '~/utils/route-guards';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ location }) => {
    requireActiveCompany(location);
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
