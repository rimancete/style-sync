import { useMutation } from '~/hooks';

export interface CreateBookingData {
  branchId: string;
  serviceId: string;
  professionalId: string | null;
  dateTime: string;
}

export interface Booking {
  id: string;
  branchId: string;
  serviceId: string;
  professionalId: string | null;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const ENDPOINT = '/api/bookings';

export const useCreateBooking = () => {
  return useMutation<Booking, CreateBookingData>({
    endpoint: ENDPOINT,
    mutationKey: ['bookings', 'create'],
    method: 'POST',
  });
};
