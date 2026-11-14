import { createFileRoute } from '@tanstack/react-router';

import { UserHomeScreen } from '~/screens/User/Home';

export const Route = createFileRoute('/salon/$slug/_client/')({
  component: UserHomeScreen,
});
