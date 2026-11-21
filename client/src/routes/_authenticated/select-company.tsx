import { createFileRoute } from '@tanstack/react-router';

import { SelectCompanyScreen } from '~/screens/SelectCompany';
import { redirectIfCompanyAlreadySelected } from '~/utils/route-guards';

type SelectCompanySearch = {
  redirect?: string;
};

export const Route = createFileRoute('/_authenticated/select-company')({
  validateSearch: (search: Record<string, unknown>): SelectCompanySearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    redirectIfCompanyAlreadySelected(search);
  },
  component: SelectCompanyRoute,
});

function SelectCompanyRoute() {
  const { redirect: redirectPath } = Route.useSearch();
  return <SelectCompanyScreen redirect={redirectPath} />;
}
