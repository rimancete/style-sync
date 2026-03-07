import { useRouter } from '@tanstack/react-router';
import { useAuthStore } from '~/store/authStore';

export function AdminHomeScreen() {
  const { navigate } = useRouter();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to your admin dashboard.</p>
      {/* add a button to logout */}
      <button
        className="bg-red-500 text-white px-4 py-2 rounded-md"
        onClick={() => {
          useAuthStore.getState().clearAuth();
          // navigate to the login page
          navigate({ to: '/login' });
        }}
      >
        Logout
      </button>
    </div>
  );
}
