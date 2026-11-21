import { isRedirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAuthResponse, MOCK_ACME, MOCK_ELITE } from '~/mocks/auth';
import { useAuthStore } from '~/store/authStore';

import {
  redirectIfAuthenticated,
  redirectIfCompanyAlreadySelected,
  redirectLegacyUserPath,
  redirectRoot,
  requireActiveCompany,
  requireAuthenticatedSession,
  requireClientSalonSession,
  requireStaffSession,
} from './route-guards';

const LOCATION = {
  href: 'http://localhost:3000/admin',
  pathname: '/admin',
};

function expectRedirect(run: () => void) {
  try {
    run();
  } catch (error) {
    expect(isRedirect(error)).toBe(true);
    if (isRedirect(error)) {
      return error;
    }
  }

  throw new Error('expected a redirect');
}

describe('route-guards', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  describe('redirectIfAuthenticated', () => {
    it('does nothing when there is no session', () => {
      expect(() => {
        redirectIfAuthenticated();
      }).not.toThrow();
    });

    it('sends an authenticated ADMIN to the admin home', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'admin@test.com', role: 'ADMIN' }));

      const redirect = expectRedirect(() => {
        redirectIfAuthenticated();
      });

      expect(redirect.options.href).toBe('/admin');
    });
  });

  describe('requireAuthenticatedSession', () => {
    it('sends a guest to login with the current URL as redirect', () => {
      const redirect = expectRedirect(() => {
        requireAuthenticatedSession({ href: LOCATION.href });
      });

      expect(redirect.options.href).toBe(
        `/login?${new URLSearchParams({ redirect: LOCATION.href }).toString()}`
      );
    });

    it('returns the session when the user is signed in', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'admin@test.com', role: 'ADMIN' }));

      expect(requireAuthenticatedSession({ href: LOCATION.href }).isAuthenticated).toBe(true);
    });
  });

  describe('requireStaffSession', () => {
    it('sends a CLIENT to the salon home', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

      const redirect = expectRedirect(() => {
        requireStaffSession();
      });

      expect(redirect.options.href).toBe('/salon/acme');
    });

    it('allows ADMIN and STAFF through', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'admin@test.com', role: 'ADMIN' }));

      expect(requireStaffSession().role).toBe('ADMIN');
    });
  });

  describe('requireActiveCompany', () => {
    it('sends staff without a company to the picker', () => {
      useAuthStore.getState().setSession(
        createMockAuthResponse({
          email: 'admin@test.com',
          role: 'ADMIN',
          customers: [MOCK_ACME, MOCK_ELITE],
        })
      );

      const redirect = expectRedirect(() => {
        requireActiveCompany({ href: LOCATION.href });
      });

      expect(redirect.options.href).toBe(
        `/select-company?${new URLSearchParams({ redirect: LOCATION.href }).toString()}`
      );
    });
  });

  describe('redirectIfCompanyAlreadySelected', () => {
    it('leaves staff without a company on the picker', () => {
      useAuthStore.getState().setSession(
        createMockAuthResponse({
          email: 'admin@test.com',
          role: 'ADMIN',
          customers: [MOCK_ACME, MOCK_ELITE],
        })
      );

      expect(() => {
        redirectIfCompanyAlreadySelected({});
      }).not.toThrow();
    });

    it('sends staff with a company into the admin area', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'admin@test.com', role: 'ADMIN' }));

      const redirect = expectRedirect(() => {
        redirectIfCompanyAlreadySelected({ redirect: '/admin/bookings' });
      });

      expect(redirect.options.href).toBe('/admin/bookings');
    });
  });

  describe('requireClientSalonSession', () => {
    it('sends a guest to the salon login', () => {
      const redirect = expectRedirect(() => {
        requireClientSalonSession(
          { slug: 'acme' },
          { href: 'http://localhost:3000/salon/acme/user', pathname: '/salon/acme/user' }
        );
      });

      expect(redirect.options.href).toBe(
        `/salon/acme/login?${new URLSearchParams({ redirect: 'http://localhost:3000/salon/acme/user' }).toString()}`
      );
    });

    it('rewrites a CLIENT onto a salon they belong to', () => {
      useAuthStore.getState().setSession(
        createMockAuthResponse({
          email: 'client@test.com',
          role: 'CLIENT',
          customers: [MOCK_ACME, MOCK_ELITE],
          defaultCustomerId: MOCK_ACME.id,
        })
      );

      const redirect = expectRedirect(() => {
        requireClientSalonSession(
          { slug: 'missing' },
          { href: 'http://localhost:3000/salon/missing/user', pathname: '/salon/missing/user' }
        );
      });

      expect(redirect.options.href).toBe('/salon/acme/user');
    });

    it('activates the salon when the CLIENT belongs to it', () => {
      useAuthStore.getState().setSession(
        createMockAuthResponse({
          email: 'client@test.com',
          role: 'CLIENT',
          customers: [MOCK_ACME, MOCK_ELITE],
          defaultCustomerId: MOCK_ACME.id,
        })
      );

      requireClientSalonSession(
        { slug: 'elite-beauty' },
        {
          href: 'http://localhost:3000/salon/elite-beauty/user',
          pathname: '/salon/elite-beauty/user',
        }
      );

      expect(useAuthStore.getState().activeCustomerSlug).toBe('elite-beauty');
    });
  });

  describe('redirectLegacyUserPath', () => {
    it('moves a CLIENT from /user into the salon tree', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

      const redirect = expectRedirect(() => {
        redirectLegacyUserPath({
          href: 'http://localhost:3000/user/profile',
          pathname: '/user/profile',
        });
      });

      expect(redirect.options.href).toBe('/salon/acme/user/profile');
    });
  });

  describe('redirectRoot', () => {
    it('sends a guest to the neutral login', () => {
      const redirect = expectRedirect(() => {
        redirectRoot({ href: 'http://localhost:3000/' });
      });

      expect(redirect.options.to).toBe('/login');
      expect(redirect.options.search).toEqual({ redirect: 'http://localhost:3000/' });
    });

    it('sends a signed-in user home', () => {
      useAuthStore
        .getState()
        .setSession(createMockAuthResponse({ email: 'admin@test.com', role: 'ADMIN' }));

      const redirect = expectRedirect(() => {
        redirectRoot({ href: 'http://localhost:3000/' });
      });

      expect(redirect.options.href).toBe('/admin');
    });
  });
});
