import { createFileRoute } from '@tanstack/react-router';
import { LoginScreen } from '~/screens/Login';

export const Route = createFileRoute('/_public/login')({
  component: LoginScreen,
});
