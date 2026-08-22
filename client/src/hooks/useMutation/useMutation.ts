import {
  useMutation as useTanstackMutation,
  useQueryClient,
  type UseMutationOptions as TanstackMutationOptions,
} from '@tanstack/react-query';

import { useAuthStore } from '~/store/authStore';

import { errorTreatment } from '../utils/errorTreatment';
import { notify } from '../utils/notify';
import { request, SessionExpiredError, type HttpMethod } from '../utils/request';
import { scopeQueryKey, type QueryKey } from '../useQuery/useQuery';

type MutationPassthroughOptions<TData, TVariables> = Omit<
  TanstackMutationOptions<TData, APIError, TVariables>,
  'mutationFn'
>;

type UseMutationParams<TData, TVariables> = {
  endpoint: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  invalidateQueries?: QueryKey[];
  refetchQueries?: QueryKey[];
  showError?: boolean;
  successMessage?: string;
  mutationOptions?: MutationPassthroughOptions<TData, TVariables>;
};

export function useMutation<TData = unknown, TVariables = unknown>({
  endpoint,
  method = 'POST',
  headers,
  invalidateQueries,
  refetchQueries,
  showError = true,
  successMessage,
  mutationOptions,
}: UseMutationParams<TData, TVariables>) {
  const queryClient = useQueryClient();
  const activeCustomerId = useAuthStore((state) => state.defaultCustomerId);

  return useTanstackMutation<TData, APIError, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      const response = await request({ endpoint, method, headers, body: variables });
      return errorTreatment<TData>({ response });
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      if (successMessage) {
        notify.success(undefined, successMessage);
      }

      await Promise.all([
        ...toScopedKeys(invalidateQueries, activeCustomerId).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        ),
        ...toScopedKeys(refetchQueries, activeCustomerId).map((queryKey) =>
          queryClient.refetchQueries({ queryKey })
        ),
      ]);

      return mutationOptions?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      // An expired session already redirects to login; a toast would be noise.
      if (showError && !(error instanceof SessionExpiredError)) {
        notify.error(undefined, describeError(error));
      }

      return mutationOptions?.onError?.(error, variables, onMutateResult, context);
    },
  });
}

function toScopedKeys(keys: QueryKey[] | undefined, customerId: string | null): QueryKey[] {
  return (keys ?? []).map((key) => scopeQueryKey(key, customerId));
}

/** Validation failures carry per-field messages that are more useful than the summary. */
function describeError(error: APIError): string {
  const fieldMessages = Object.values(error.errors ?? {}).flat();

  return fieldMessages.length > 0 ? fieldMessages.join('\n') : error.message;
}
