import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginScreen } from '~/screens/Login';
import { useAuthStore } from '~/store/authStore';
import { getHomePath } from '~/utils/session-paths.util';

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/salon/$slug/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    const session = useAuthStore.getState();

    if (session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }
  },
  component: SalonLoginRoute,
});

function SalonLoginRoute() {
  const { slug } = Route.useParams();
  const { redirect: redirectPath } = Route.useSearch();

  return <LoginScreen slug={slug} redirect={redirectPath} />;
}
