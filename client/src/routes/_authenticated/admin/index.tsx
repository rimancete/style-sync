import { createFileRoute } from '@tanstack/react-router';

import { AdminHomeScreen } from '~/screens/Admin/Home';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminHomeScreen,
});
