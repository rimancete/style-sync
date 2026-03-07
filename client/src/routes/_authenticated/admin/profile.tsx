import { createFileRoute } from '@tanstack/react-router';
import { AdminProfileScreen } from '~/screens/Admin/Profile';

export const Route = createFileRoute('/_authenticated/admin/profile')({
  component: AdminProfileScreen,
});
