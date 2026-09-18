import { useRouter } from '@tanstack/react-router';

import { useMutation } from '~/hooks/useMutation';
import { useAuthStore, type AuthResponse } from '~/store';
import { getSafeInternalPath } from '~/utils/redirect.util';

export type LoginCredentials = {
  email: string;
  password: string;
};

const ENDPOINT = '/api/auth/login';

export function useLogin(redirect?: string) {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  return useMutation<AuthResponse, LoginCredentials>({
    endpoint: ENDPOINT,
    // Login surfaces failures through the inline alert, not a toast.
    showError: false,
    mutationOptions: {
      mutationKey: ['auth', 'login'],
      onSuccess: (data) => {
        setSession(data);
        void router.navigate({ href: getSafeInternalPath(redirect) });
      },
    },
  });
}
