import { useRouter } from '@tanstack/react-router';

import { useMutation } from '~/hooks/useMutation';
import { useAuthStore, type AuthResponse } from '~/store';

export type LoginCredentials = {
  email: string;
  password: string;
};

const ENDPOINT = '/api/auth/login';

export function useLogin() {
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
        router.navigate({ to: '/' });
      },
    },
  });
}
