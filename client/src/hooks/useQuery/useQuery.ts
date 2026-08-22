import {
  useQuery as useTanstackQuery,
  type UseQueryOptions as TanstackQueryOptions,
} from '@tanstack/react-query';

import { useAuthStore } from '~/store/authStore';
import { isMocksEnabled } from '~/utils/env';

import { errorTreatment } from '../utils/errorTreatment';
import { request } from '../utils/request';

export type QueryKey = (string | number)[];

/** Cache scope for requests made before a session exists. */
const PUBLIC_SCOPE = 'public';

const DEFAULT_MOCK_DELAY = 1000;

type QueryPassthroughOptions<T> = Omit<
  TanstackQueryOptions<T, APIError, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

type UseQueryParams<T> = {
  endpoint: string;
  queryKey: QueryKey;
  headers?: Record<string, string>;
  mockData?: T;
  mockDelay?: number;
  queryOptions?: QueryPassthroughOptions<T>;
};

export function useQuery<T>({
  endpoint,
  queryKey,
  headers,
  mockData,
  mockDelay = DEFAULT_MOCK_DELAY,
  queryOptions,
}: UseQueryParams<T>) {
  const activeCustomerId = useAuthStore((state) => state.defaultCustomerId);
  const scopedQueryKey = scopeQueryKey(queryKey, activeCustomerId);

  const query = useTanstackQuery<T, APIError, T, QueryKey>({
    retry: false,
    refetchOnWindowFocus: false,
    ...queryOptions,
    queryKey: scopedQueryKey,
    queryFn: async () => {
      if (isMocksEnabled() && mockData !== undefined) {
        await wait(mockDelay);
        return mockData;
      }

      const response = await request({ endpoint, method: 'GET', headers });
      return errorTreatment<T>({ response });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    queryKey: scopedQueryKey,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

/**
 * Cached data belongs to a tenant, so the active customer prefixes every key.
 * Switching context therefore can never surface another tenant's data.
 */
export function scopeQueryKey(queryKey: QueryKey, customerId: string | null): QueryKey {
  return [customerId ?? PUBLIC_SCOPE, ...queryKey];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
