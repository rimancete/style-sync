import type { CustomerSummary } from '~/store/authStore';

import { createUnsignedJwt } from './jwt';

const ONE_HOUR_IN_SECONDS = 60 * 60;

export const MOCK_ACME: CustomerSummary = {
  id: 'customer-acme',
  displayId: 1,
  name: 'Acme Barbershop',
  urlSlug: 'acme',
};

export const MOCK_ELITE: CustomerSummary = {
  id: 'customer-elite',
  displayId: 2,
  name: 'Elite Beauty Salon',
  urlSlug: 'elite-beauty',
};

export const MOCK_CUSTOMER = MOCK_ACME;

export function createMockAuthResponse(options: {
  email: string;
  role: 'CLIENT' | 'STAFF' | 'ADMIN';
  userId?: string;
  userName?: string;
  customers?: CustomerSummary[];
  defaultCustomerId?: string;
}) {
  const userId = options.userId ?? 'user-1';
  const customers = options.customers ?? [MOCK_CUSTOMER];
  const defaultCustomerId = options.defaultCustomerId ?? customers[0]?.id;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const claims = {
    sub: userId,
    email: options.email,
    role: options.role,
    customerIds: customers.map(({ id }) => id),
    defaultCustomerId,
    exp: nowInSeconds + ONE_HOUR_IN_SECONDS,
  };

  return {
    token: createUnsignedJwt(claims),
    refreshToken: createUnsignedJwt({
      ...claims,
      exp: nowInSeconds + ONE_HOUR_IN_SECONDS * 24,
    }),
    userId,
    userName: options.userName ?? 'Test User',
    phone: null,
    customers,
    defaultCustomerId,
  };
}
