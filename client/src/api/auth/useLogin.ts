import { useRouter } from '@tanstack/react-router';

import { useMutation } from '~/hooks/useMutation';
import { useAuthStore, type AuthResponse } from '~/store';
import { resolvePostLoginPath } from '~/utils/session-paths.util';

export type LoginCredentials = {
  email: string;
  password: string;
};

type UseLoginParams = {
  /** Salon CLIENT login when set; neutral ADMIN and STAFF login otherwise. */
  slug?: string;
  redirect?: string;
};

const NEUTRAL_ENDPOINT = '/api/auth/login';

export function getLoginEndpoint(slug?: string): string {
  return slug ? `/api/salon/${encodeURIComponent(slug)}/auth/login` : NEUTRAL_ENDPOINT;
}

export function useLogin({ slug, redirect }: UseLoginParams = {}) {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  return useMutation<AuthResponse, LoginCredentials>({
    endpoint: getLoginEndpoint(slug),
    // Login surfaces failures through the inline alert, not a toast.
    showError: false,
    mutationOptions: {
      mutationKey: ['auth', 'login', slug ?? 'neutral'],
      onSuccess: (data) => {
        setSession(data);
        void router.navigate({
          href: resolvePostLoginPath(useAuthStore.getState(), redirect),
        });
      },
    },
  });
}
