import { useRouter } from '@tanstack/react-router';

import { useMutation } from '~/hooks/useMutation';
import { useAuthStore, type AuthResponse } from '~/store';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  confirmLink?: boolean;
};

export function useRegister(slug: string) {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  const mutation = useMutation<AuthResponse, RegisterPayload>({
    endpoint: `/api/salon/${slug}/auth/register`,
    showError: false,
    mutationOptions: {
      mutationKey: ['auth', 'register', slug],
      onSuccess: (data) => {
        setSession(data);
        void router.navigate({ href: '/' });
      },
    },
  });

  /**
   * Skips the request when the salon slug is blank, so a route without a slug never POSTs.
   */
  function mutate(variables: RegisterPayload, options?: Parameters<typeof mutation.mutate>[1]) {
    if (slug.trim().length === 0) {
      return;
    }

    mutation.mutate(variables, options);
  }

  return { ...mutation, mutate };
}
