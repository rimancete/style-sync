import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:4000';

export const handlers = [
  // Auth handlers
  http.post(`${baseUrl}/api/auth/login`, async () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
      },
      token: 'mock-jwt-token',
    });
  }),

  http.post(`${baseUrl}/api/auth/register`, async () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
      },
      token: 'mock-jwt-token',
    });
  }),

  // Branches handlers
  http.get(`${baseUrl}/api/branches`, async () => {
    return HttpResponse.json([
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
    ]);
  }),

  // Services handlers
  http.get(`${baseUrl}/api/services`, async () => {
    return HttpResponse.json([
      { id: '1', name: 'Social + Beard', price: 85.0, duration: 60 },
      { id: '2', name: 'Social (Scissors or Clipper)', price: 40.0, duration: 45 },
      { id: '3', name: 'Eyebrow', price: 15.0, duration: 15 },
    ]);
  }),

  // Professionals handlers
  http.get(`${baseUrl}/api/professionals`, async () => {
    return HttpResponse.json([
      { id: '1', name: 'Michel' },
      { id: '2', name: 'Luis' },
      { id: '3', name: 'Dario' },
      { id: '4', name: 'Andre' },
    ]);
  }),

  // Bookings handlers
  http.post(`${baseUrl}/api/bookings`, async () => {
    return HttpResponse.json({
      id: '1',
      branchId: '1',
      serviceId: '1',
      professionalId: '2',
      dateTime: '2026-01-20T14:50:00Z',
      status: 'pending',
    });
  }),
];
