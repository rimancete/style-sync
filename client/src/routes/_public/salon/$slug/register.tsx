import { createFileRoute } from '@tanstack/react-router';
import { RegisterScreen } from '~/screens/Register';

export const Route = createFileRoute('/_public/salon/$slug/register')({
  component: RegisterRoute,
});

function RegisterRoute() {
  const { slug } = Route.useParams();
  return <RegisterScreen slug={slug} />;
}
