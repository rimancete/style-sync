import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { useAuthStore } from '~/store/authStore';
import { getLoginPath } from '~/utils/session-paths.util';

/** Ends the session and returns to the login the user came from (salon or neutral). */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return function logout() {
    const loginPath = getLoginPath(useAuthStore.getState());
    useAuthStore.getState().clearAuth();
    queryClient.clear();
    void router.navigate({ href: loginPath });
  };
}
