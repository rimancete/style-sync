import { http, HttpResponse } from 'msw';

import { createMockAuthResponse, MOCK_CUSTOMER } from './auth';
import booking from './data/booking.json';
import branches from './data/branches.json';
import professionals from './data/professionals.json';
import services from './data/services.json';
import usersFixture from './data/users.json';

const baseUrl = 'http://localhost:3001';

const VALID_PASSWORD = usersFixture.password;

type MockRole = 'ADMIN' | 'CLIENT' | 'STAFF';

type MockUser = {
  role: MockRole;
  userName: string;
  userId: string;
};

const MOCK_USERS = usersFixture.users as Record<string, MockUser>;

export const handlers = [
  http.post(`${baseUrl}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.email.includes('@')) {
      return HttpResponse.json(
        {
          status: 422,
          message: 'Validation failed',
          errors: { email: ['email must be an email'] },
        },
        { status: 422 }
      );
    }

    const user = MOCK_USERS[body.email];

    if (!user || body.password !== VALID_PASSWORD) {
      return HttpResponse.json({ status: 401, message: 'Invalid credentials' }, { status: 401 });
    }

    return HttpResponse.json({
      data: createMockAuthResponse({
        email: body.email,
        role: user.role,
        userId: user.userId,
        userName: user.userName,
      }),
    });
  }),

  http.post(`${baseUrl}/api/auth/refresh`, ({ request }) => {
    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ') || authorization === 'Bearer invalid') {
      return HttpResponse.json({ status: 401, message: 'Invalid refresh token' }, { status: 401 });
    }

    return HttpResponse.json({
      data: createMockAuthResponse({
        email: 'client@test.com',
        role: 'CLIENT',
        userName: 'Test User',
      }),
    });
  }),

  http.post(`${baseUrl}/api/salon/:slug/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; name?: string };

    return HttpResponse.json(
      {
        data: createMockAuthResponse({
          email: body.email ?? 'test@example.com',
          role: 'CLIENT',
          userName: body.name ?? 'Test User',
        }),
      },
      { status: 201 }
    );
  }),

  http.get(`${baseUrl}/api/customers/my-customers`, () => {
    return HttpResponse.json({
      data: [MOCK_CUSTOMER],
    });
  }),

  http.get(`${baseUrl}/api/branches`, () => {
    return HttpResponse.json({
      data: branches,
    });
  }),

  http.get(`${baseUrl}/api/services`, () => {
    return HttpResponse.json({
      data: services,
    });
  }),

  http.get(`${baseUrl}/api/professionals`, () => {
    return HttpResponse.json({
      data: professionals,
    });
  }),

  http.post(`${baseUrl}/api/bookings`, () => {
    return HttpResponse.json({
      data: booking,
    });
  }),
];
