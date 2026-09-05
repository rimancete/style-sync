import { createUnsignedJwt } from './jwt';

const ONE_HOUR_IN_SECONDS = 60 * 60;

export const MOCK_CUSTOMER = {
  id: 'customer-1',
  displayId: 1,
  name: 'StyleSync Salon',
  urlSlug: 'stylesync',
};

export function createMockAuthResponse(options: {
  email: string;
  role: 'CLIENT' | 'STAFF' | 'ADMIN';
  userId?: string;
  userName?: string;
}) {
  const userId = options.userId ?? 'user-1';
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const claims = {
    sub: userId,
    email: options.email,
    role: options.role,
    customerIds: [MOCK_CUSTOMER.id],
    defaultCustomerId: MOCK_CUSTOMER.id,
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
    customers: [MOCK_CUSTOMER],
    defaultCustomerId: MOCK_CUSTOMER.id,
  };
}
