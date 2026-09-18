import { createFileRoute } from '@tanstack/react-router';
import { LoginScreen } from '~/screens/Login';

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/_public/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  return <LoginScreen redirect={redirect} />;
}
