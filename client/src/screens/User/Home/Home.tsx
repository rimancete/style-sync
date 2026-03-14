import { useRouter } from '@tanstack/react-router';
import { useAuthStore } from '~/store/authStore';

export function UserHomeScreen() {
  const { navigate } = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <p className="text-muted-foreground mt-2">View and manage your appointments.</p>
      {/* add a button to logout */}
      <button
        className="bg-red-500 text-white px-4 py-2 rounded-md"
        onClick={() => {
          useAuthStore.getState().clearAuth();
          navigate({ to: '/login' });
        }}
      >
        Logout
      </button>
    </div>
  );
}
