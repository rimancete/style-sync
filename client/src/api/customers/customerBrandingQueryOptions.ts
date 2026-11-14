import { queryOptions } from '@tanstack/react-query';

import { errorTreatment, request } from '~/hooks/utils';
import { scopeQueryKey } from '~/hooks/useQuery/useQuery';

import type { CustomerBranding } from './types';

const BRANDING_STALE_TIME_MS = 1000 * 60 * 30;

/**
 * Query options rather than a hook: salon routes resolve the branding in their
 * loader (`ensureQueryData`) so the salon theme is applied before first paint.
 * Branding is public, so it lives in the public cache scope for every user.
 */
export function customerBrandingQueryOptions(slug: string) {
  return queryOptions<CustomerBranding, APIError>({
    queryKey: scopeQueryKey(['customers', 'branding', slug], null),
    queryFn: async () => {
      const response = await request({
        endpoint: `/api/customers/branding/${encodeURIComponent(slug)}`,
      });
      return errorTreatment<CustomerBranding>({ response });
    },
    staleTime: BRANDING_STALE_TIME_MS,
    retry: false,
  });
}
