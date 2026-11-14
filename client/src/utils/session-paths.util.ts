import type { Role } from '~/store/authStore';

import { isSafeInternalPath } from './redirect.util';

export const NEUTRAL_LOGIN_PATH = '/login';
export const ADMIN_HOME_PATH = '/admin';
export const SELECT_COMPANY_PATH = '/select-company';

const SALON_PATH_PATTERN = /^\/salon\/[^/?#]+/;

type SessionRouting = {
  role: Role | null;
  activeCustomerId: string | null;
  activeCustomerSlug: string | null;
};

export function salonPath(slug: string, subpath = ''): string {
  return `/salon/${slug}${subpath}`;
}

/** Where a session that ends (logout or expiry) should sign in again. */
export function getLoginPath({
  role,
  activeCustomerSlug,
}: Pick<SessionRouting, 'role' | 'activeCustomerSlug'>): string {
  return role === 'CLIENT' && activeCustomerSlug
    ? salonPath(activeCustomerSlug, '/login')
    : NEUTRAL_LOGIN_PATH;
}

/** The landing page of a signed-in user. */
export function getHomePath(session: SessionRouting): string {
  if (session.role === 'CLIENT') {
    return session.activeCustomerSlug ? salonPath(session.activeCustomerSlug) : NEUTRAL_LOGIN_PATH;
  }

  if (session.role === 'ADMIN' || session.role === 'STAFF') {
    return session.activeCustomerId ? ADMIN_HOME_PATH : SELECT_COMPANY_PATH;
  }

  return NEUTRAL_LOGIN_PATH;
}

/**
 * Honors the return URL only inside the area the user just entered: a CLIENT
 * stays in its own salon and an ADMIN or STAFF stays in the admin area.
 */
export function resolvePostLoginPath(session: SessionRouting, redirect?: string): string {
  const home = getHomePath(session);

  if (!isSafeInternalPath(redirect)) {
    return home;
  }

  if (session.role === 'CLIENT' && session.activeCustomerSlug) {
    return isWithinPath(redirect, salonPath(session.activeCustomerSlug)) ? redirect : home;
  }

  if (home === SELECT_COMPANY_PATH) {
    return isWithinPath(redirect, ADMIN_HOME_PATH)
      ? `${SELECT_COMPANY_PATH}?${new URLSearchParams({ redirect }).toString()}`
      : home;
  }

  return isWithinPath(redirect, ADMIN_HOME_PATH) ? redirect : home;
}

/** `/salon/acme/user/profile` with `elite-beauty` becomes `/salon/elite-beauty/user/profile`. */
export function replaceSalonSlug(pathname: string, slug: string): string {
  return SALON_PATH_PATTERN.test(pathname)
    ? pathname.replace(SALON_PATH_PATTERN, salonPath(slug))
    : salonPath(slug);
}

export function withRedirectQuery(path: string, redirect: string): string {
  return `${path}?${new URLSearchParams({ redirect }).toString()}`;
}

function isWithinPath(path: string, base: string): boolean {
  return path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`);
}
