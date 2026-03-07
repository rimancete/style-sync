import { createFileRoute } from '@tanstack/react-router';
import { AdminBookingsScreen } from '~/screens/Admin/Bookings';

export const Route = createFileRoute('/_authenticated/admin/bookings')({
  component: AdminBookingsScreen,
});
