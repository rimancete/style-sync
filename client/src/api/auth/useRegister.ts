import { useMutation } from '~/hooks';

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
  };
  token: string;
}

const ENDPOINT = '/api/auth/register';

export const useRegister = () => {
  return useMutation<RegisterResponse, RegisterData>({
    endpoint: ENDPOINT,
    mutationKey: ['auth', 'register'],
    method: 'POST',
  });
};
