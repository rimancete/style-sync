import { useMutation } from '~/hooks';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
  };
  token: string;
}

const ENDPOINT = '/api/auth/login';

export const useLogin = () => {
  return useMutation<LoginResponse, LoginCredentials>({
    endpoint: ENDPOINT,
    mutationKey: ['auth', 'login'],
    method: 'POST',
  });
};
