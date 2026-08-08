import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuthStore } from '~/store';
import { AdminHomeScreen } from '~/screens/Admin/Home';
import { UserHomeScreen } from '~/screens/User/Home';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role === 'admin') {
    return <AdminHomeScreen />;
  }

  return <UserHomeScreen />;
}
