import { useMutation as useTanstackMutation, UseMutationOptions } from '@tanstack/react-query';
import { useAuthStore } from '~/store/authStore';

interface UseMutationConfig<TData, _TVariables> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  mutationKey?: (string | number)[];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useMutation<TData = unknown, TVariables = unknown>({
  endpoint,
  method = 'POST',
  mutationKey,
  onSuccess,
  onError,
}: UseMutationConfig<TData, TVariables>) {
  const token = useAuthStore((state) => state.token);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  return useTanstackMutation({
    mutationKey,
    mutationFn: async (variables: TVariables) => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json() as Promise<TData>;
    },
    onSuccess,
    onError,
  } as UseMutationOptions<TData, Error, TVariables>);
}
