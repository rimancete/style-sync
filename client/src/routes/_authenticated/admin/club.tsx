import { createFileRoute } from '@tanstack/react-router';
import { AdminClubScreen } from '~/screens/Admin/Club';

export const Route = createFileRoute('/_authenticated/admin/club')({
  component: AdminClubScreen,
});
