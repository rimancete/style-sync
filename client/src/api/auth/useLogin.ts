import { useMutation } from '~/hooks/useMutation';
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

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation<LoginResponse, LoginCredentials>({
    endpoint: '/api/auth/login',
    mutationKey: ['auth', 'login'],
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      router.navigate({ to: '/' });
    },
  });
}
