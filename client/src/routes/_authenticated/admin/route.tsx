import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin')({
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
