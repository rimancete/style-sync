import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackQueryOptions,
} from '@tanstack/react-query';
import { useAuthStore } from '~/store/authStore';

interface UseQueryOptions<T> {
  endpoint: string;
  queryKey: (string | number)[];
  mockData?: T;
  mockDelay?: number;
  enabled?: boolean;
}

export function useQuery<T>({
  endpoint,
  queryKey,
  mockData,
  mockDelay = 1000,
  enabled = true,
}: UseQueryOptions<T>) {
  const token = useAuthStore((state) => state.token);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  return useTanstackQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      // Use mock data in development if provided
      if (import.meta.env.DEV && mockData) {
        await new Promise((resolve) => setTimeout(resolve, mockDelay));
        return mockData;
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    },
  } as TanstackQueryOptions<T>);
}
