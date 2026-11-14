import { createFileRoute, redirect } from '@tanstack/react-router';

import { RegisterScreen } from '~/screens/Register';
import { useAuthStore } from '~/store/authStore';
import { getHomePath } from '~/utils/session-paths.util';

export const Route = createFileRoute('/salon/$slug/register')({
  beforeLoad: () => {
    const session = useAuthStore.getState();

    if (session.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: getHomePath(session) });
    }
  },
  component: SalonRegisterRoute,
});

function SalonRegisterRoute() {
  const { slug } = Route.useParams();
  return <RegisterScreen slug={slug} />;
}
