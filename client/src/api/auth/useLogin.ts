import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useAuthStore } from '~/store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
  };
  token: string;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ENDPOINT = `${baseUrl}/api/auth/login`;

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationKey: ['auth', 'login'],
    mutationFn: async (credentials) => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Login failed');
      }

      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.navigate({ to: '/' });
    },
  });
}
