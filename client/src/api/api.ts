import { useLogin, useRegister } from './auth';
import { useGetBranches } from './branches';
import { customerBrandingQueryOptions, useGetMyCustomers } from './customers';
import { useGetServices } from './services';
import { useGetProfessionals } from './professionals';
import { useCreateBooking } from './bookings';

export const api = {
  auth: {
    login: useLogin,
    register: useRegister,
  },
  customers: {
    mine: useGetMyCustomers,
    brandingQueryOptions: customerBrandingQueryOptions,
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
};
