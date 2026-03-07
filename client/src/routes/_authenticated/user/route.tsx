import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/user')({
  component: UserLayout,
});

function UserLayout() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
