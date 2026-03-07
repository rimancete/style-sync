import { createFileRoute } from '@tanstack/react-router';
import { UserProfileScreen } from '~/screens/User/Profile';

export const Route = createFileRoute('/_authenticated/user/profile')({
  component: UserProfileScreen,
});
