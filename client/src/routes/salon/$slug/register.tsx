import { createFileRoute } from '@tanstack/react-router';

import { RegisterScreen } from '~/screens/Register';
import { redirectIfAuthenticated } from '~/utils/route-guards';

export const Route = createFileRoute('/salon/$slug/register')({
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: SalonRegisterRoute,
});

function SalonRegisterRoute() {
  const { slug } = Route.useParams();
  return <RegisterScreen slug={slug} />;
}
