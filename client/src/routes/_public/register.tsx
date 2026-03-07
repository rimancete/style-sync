import { createFileRoute } from '@tanstack/react-router';
import { RegisterScreen } from '~/screens/Register';

export const Route = createFileRoute('/_public/register')({
  component: RegisterScreen,
});
