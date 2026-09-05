import { useLogin, useRegister } from './auth';
import { useGetBranches } from './branches';
import { useGetMyCustomers } from './customers';
import { useGetServices } from './services';
import { useGetProfessionals } from './professionals';
import { useCreateBooking } from './bookings';
import { useGetTheme } from './theme';

export const api = {
  auth: {
    login: useLogin,
    register: useRegister,
  },
  customers: {
    mine: useGetMyCustomers,
  },
  branches: {
    list: useGetBranches,
  },
  services: {
    list: useGetServices,
  },
  professionals: {
    list: useGetProfessionals,
  },
  bookings: {
    create: useCreateBooking,
  },
  theme: {
    get: useGetTheme,
  },
};
