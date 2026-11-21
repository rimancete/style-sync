import { createFileRoute } from '@tanstack/react-router';

import { LoginScreen } from '~/screens/Login';
import { redirectIfAuthenticated } from '~/utils/route-guards';

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/salon/$slug/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: SalonLoginRoute,
});

function SalonLoginRoute() {
  const { slug } = Route.useParams();
  const { redirect: redirectPath } = Route.useSearch();

  return <LoginScreen slug={slug} redirect={redirectPath} />;
}
