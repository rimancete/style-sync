import { redirect } from '@tanstack/react-router';

import { findCustomerBySlug, useAuthStore } from '~/store/authStore';
import {
  getHomePath,
  getLoginPath,
  replaceSalonSlug,
  resolvePostLoginPath,
  salonPath,
  SELECT_COMPANY_PATH,
  withRedirectQuery,
} from '~/utils/session-paths.util';

type LocationHref = {
  href: string;
};

type LocationPath = LocationHref & {
  pathname: string;
};

/**
 * Internal redirects use a built href (salon slug, redirect query). TanStack's
 * RedirectOptions still wants a typed `to` unless the object is inferred at the
 * `redirect()` call site, so the helper takes the href and asserts once.
 */
function throwRedirect(href: string): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect({ href } as Parameters<typeof redirect>[0]);
}

export function redirectIfAuthenticated(): void {
  const session = useAuthStore.getState();

  if (session.isAuthenticated) {
    throwRedirect(getHomePath(session));
  }
}

export function requireAuthenticatedSession(location: LocationHref) {
  const session = useAuthStore.getState();

  if (!session.isAuthenticated) {
    throwRedirect(withRedirectQuery(getLoginPath(session), location.href));
  }

  return session;
}

export function requireStaffSession() {
  const session = useAuthStore.getState();

  if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
    throwRedirect(getHomePath(session));
  }

  return session;
}

export function requireActiveCompany(location: LocationHref) {
  const session = requireStaffSession();

  if (!session.activeCustomerId) {
    throwRedirect(withRedirectQuery(SELECT_COMPANY_PATH, location.href));
  }

  return session;
}

export function redirectIfCompanyAlreadySelected(search: { redirect?: string }): void {
  const session = requireStaffSession();

  if (session.activeCustomerId) {
    throwRedirect(resolvePostLoginPath(session, search.redirect));
  }
}

export function requireClientSalonSession(params: { slug: string }, location: LocationPath): void {
  const session = useAuthStore.getState();

  if (!session.isAuthenticated) {
    throwRedirect(withRedirectQuery(salonPath(params.slug, '/login'), location.href));
  }

  if (session.role !== 'CLIENT') {
    throwRedirect(getHomePath(session));
  }

  const linked = findCustomerBySlug(session.customers, params.slug);

  if (!linked) {
    const fallbackSlug = session.activeCustomerSlug ?? session.customers[0]?.urlSlug;

    if (!fallbackSlug) {
      throwRedirect(getLoginPath(session));
    }

    throwRedirect(replaceSalonSlug(location.pathname, fallbackSlug));
  }

  useAuthStore.getState().setActiveCustomer(linked.id);
}

export function redirectLegacyUserPath(location: LocationPath): never {
  const session = requireAuthenticatedSession(location);

  if (session.role === 'CLIENT' && session.activeCustomerSlug) {
    const suffix = location.pathname.slice('/user'.length);
    throwRedirect(salonPath(session.activeCustomerSlug, `/user${suffix}`));
  }

  throwRedirect(getHomePath(session));
}

export function redirectRoot(location: LocationHref): never {
  const session = useAuthStore.getState();

  if (!session.isAuthenticated) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    });
  }

  throwRedirect(getHomePath(session));
}
