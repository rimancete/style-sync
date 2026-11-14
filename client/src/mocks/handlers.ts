import { http, HttpResponse } from 'msw';

import type { CustomerBranding } from '~/api/customers/types';
import type { CustomerSummary } from '~/store/authStore';

import { createMockAuthResponse, MOCK_ACME, MOCK_CUSTOMER, MOCK_ELITE } from './auth';
import booking from './data/booking.json';
import brandingFixture from './data/branding.json';
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
  customerSlugs: string[];
};

type Credentials = { email?: string; password?: string };

const MOCK_USERS = usersFixture.users as Record<string, MockUser>;

const MOCK_CUSTOMERS_BY_SLUG: Record<string, CustomerSummary> = {
  [MOCK_ACME.urlSlug]: MOCK_ACME,
  [MOCK_ELITE.urlSlug]: MOCK_ELITE,
};

export const MOCK_BRANDING = brandingFixture as Record<string, CustomerBranding>;

/** Mirrors `CLIENT_NEUTRAL_LOGIN_MESSAGE` and friends in `server/src/auth/auth.service.ts`. */
export const MOCK_LOGIN_MESSAGES = {
  clientOnNeutralLogin: 'Clients must sign in through their salon link',
  notClient: 'Only clients can sign in through a salon link',
  notLinked: 'This account is not registered with this salon',
} as const;

function linkedCustomers(user: MockUser): CustomerSummary[] {
  return user.customerSlugs.map((slug) => MOCK_CUSTOMERS_BY_SLUG[slug]).filter(Boolean);
}

function errorResponse(status: number, message: string) {
  return HttpResponse.json({ status, message }, { status });
}

/** Validates the payload and password the same way both login endpoints do. */
function authenticate(
  body: Credentials
): { user: MockUser; email: string } | { failure: ReturnType<typeof HttpResponse.json> } {
  if (!body.email || !body.email.includes('@')) {
    return {
      failure: HttpResponse.json(
        {
          status: 422,
          message: 'Validation failed',
          errors: { email: ['email must be an email'] },
        },
        { status: 422 }
      ),
    };
  }

  const user = MOCK_USERS[body.email];

  if (!user || body.password !== VALID_PASSWORD) {
    return { failure: errorResponse(401, 'Invalid credentials') };
  }

  return { user, email: body.email };
}

export const handlers = [
  http.post(`${baseUrl}/api/auth/login`, async ({ request }) => {
    const result = authenticate((await request.json()) as Credentials);

    if ('failure' in result) {
      return result.failure;
    }

    const { user, email } = result;

    if (user.role === 'CLIENT') {
      return errorResponse(403, MOCK_LOGIN_MESSAGES.clientOnNeutralLogin);
    }

    return HttpResponse.json({
      data: createMockAuthResponse({
        email,
        role: user.role,
        userId: user.userId,
        userName: user.userName,
        customers: linkedCustomers(user),
      }),
    });
  }),

  http.post(`${baseUrl}/api/salon/:slug/auth/login`, async ({ request, params }) => {
    const salon = MOCK_CUSTOMERS_BY_SLUG[String(params.slug)];

    if (!salon) {
      return errorResponse(404, 'Customer not found or inactive');
    }

    const result = authenticate((await request.json()) as Credentials);

    if ('failure' in result) {
      return result.failure;
    }

    const { user, email } = result;

    if (user.role !== 'CLIENT') {
      return errorResponse(403, MOCK_LOGIN_MESSAGES.notClient);
    }

    const customers = linkedCustomers(user);

    if (!customers.some(({ id }) => id === salon.id)) {
      return errorResponse(403, MOCK_LOGIN_MESSAGES.notLinked);
    }

    return HttpResponse.json({
      data: createMockAuthResponse({
        email,
        role: user.role,
        userId: user.userId,
        userName: user.userName,
        customers,
        defaultCustomerId: salon.id,
      }),
    });
  }),

  http.get(`${baseUrl}/api/customers/branding/:slug`, ({ params }) => {
    const branding = MOCK_BRANDING[String(params.slug)];

    if (!branding) {
      return errorResponse(404, `Customer with URL slug '${String(params.slug)}' not found`);
    }

    return HttpResponse.json({ data: branding });
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
