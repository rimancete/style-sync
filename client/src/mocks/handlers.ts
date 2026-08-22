import { http, HttpResponse } from 'msw';

import { createMockAuthResponse, MOCK_CUSTOMER } from './auth';

const baseUrl = 'http://localhost:3001';

const VALID_PASSWORD = '123456';

const MOCK_USERS = {
  'admin@stylesync.com': {
    role: 'ADMIN' as const,
    userName: 'Admin User',
    userId: 'admin-1',
  },
  'client@test.com': {
    role: 'CLIENT' as const,
    userName: 'Test User',
    userId: 'client-1',
  },
};

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

    const user = MOCK_USERS[body.email as keyof typeof MOCK_USERS];

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

  http.post(`${baseUrl}/api/auth/register`, () => {
    return HttpResponse.json({
      data: createMockAuthResponse({
        email: 'test@example.com',
        role: 'CLIENT',
        userName: 'Test User',
      }),
    });
  }),

  http.get(`${baseUrl}/api/customers/my-customers`, () => {
    return HttpResponse.json({
      data: [MOCK_CUSTOMER],
    });
  }),

  http.get(`${baseUrl}/api/branches`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'Unit 1',
          address: '98 Mario Pedro Vercellino Avenue',
          phoneNumber: '+1 (555) 123-4567',
        },
        {
          id: '2',
          name: 'Unit 2',
          address: '152 Professor José Assad Atalla Júnior Street',
          phoneNumber: '+1 (555) 987-6543',
        },
      ],
    });
  }),

  http.get(`${baseUrl}/api/services`, () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Social + Beard', price: 85.0, duration: 60 },
        { id: '2', name: 'Social (Scissors or Clipper)', price: 40.0, duration: 45 },
        { id: '3', name: 'Eyebrow', price: 15.0, duration: 15 },
      ],
    });
  }),

  http.get(`${baseUrl}/api/professionals`, () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Michel' },
        { id: '2', name: 'Luis' },
        { id: '3', name: 'Dario' },
        { id: '4', name: 'Andre' },
      ],
    });
  }),

  http.post(`${baseUrl}/api/bookings`, () => {
    return HttpResponse.json({
      data: {
        id: '1',
        branchId: '1',
        serviceId: '1',
        professionalId: '2',
        dateTime: '2026-01-20T14:50:00Z',
        status: 'pending',
      },
    });
  }),
];
