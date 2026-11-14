import { createFileRoute, redirect } from '@tanstack/react-router';

import { SelectCompanyScreen } from '~/screens/SelectCompany';
import { useAuthStore } from '~/store/authStore';
import { getHomePath, resolvePostLoginPath } from '~/utils/session-paths.util';

type SelectCompanySearch = {
  redirect?: string;
};

export const Route = createFileRoute('/_authenticated/select-company')({
  validateSearch: (search: Record<string, unknown>): SelectCompanySearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    const session = useAuthStore.getState();

    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }

    if (session.activeCustomerId) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: resolvePostLoginPath(session, search.redirect) });
    }
  },
  component: SelectCompanyRoute,
});

function SelectCompanyRoute() {
  const { redirect: redirectPath } = Route.useSearch();
  return <SelectCompanyScreen redirect={redirectPath} />;
}
