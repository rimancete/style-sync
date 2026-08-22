import { jwtDecode } from 'jwt-decode';

/**
 * JWT helpers backed by `jwt-decode`.
 *
 * The library is used instead of a manual `atob` because the payload carries
 * accented user names, which `atob` corrupts by decoding as Latin-1.
 *
 * Decoding does not verify the signature and must never be treated as an
 * authorisation decision — it only feeds navigation and presentation.
 */

const MILLISECONDS_PER_SECOND = 1000;

type ExpirableClaims = {
  exp?: number;
};

export function decodeToken<T>(token: string): T | null {
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

/**
 * A token without an `exp` claim is treated as expired: without an expiry there
 * is no safe way to trust it, so the session is renewed instead.
 */
export function isTokenExpired(token: string): boolean {
  const claims = decodeToken<ExpirableClaims>(token);

  if (!claims || typeof claims.exp !== 'number') {
    return true;
  }

  return claims.exp * MILLISECONDS_PER_SECOND <= Date.now();
}
