import { createFileRoute } from '@tanstack/react-router';
import { AdminPlanScreen } from '~/screens/Admin/Plan';

export const Route = createFileRoute('/_authenticated/admin/plan')({
  component: AdminPlanScreen,
});
