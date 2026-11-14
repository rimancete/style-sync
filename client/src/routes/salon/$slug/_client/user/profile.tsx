import { createFileRoute } from '@tanstack/react-router';

import { UserProfileScreen } from '~/screens/User/Profile';

export const Route = createFileRoute('/salon/$slug/_client/user/profile')({
  component: UserProfileScreen,
});
