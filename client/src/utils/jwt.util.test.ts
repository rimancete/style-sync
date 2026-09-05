import { describe, expect, it } from 'vitest';

import { createUnsignedJwt } from '~/mocks/jwt';
import { decodeToken, isTokenExpired } from '~/utils/jwt.util';

const ONE_HOUR_IN_SECONDS = 60 * 60;

describe('decodeToken', () => {
  it('returns the payload of a valid token, including accented names', () => {
    const token = createUnsignedJwt({
      sub: 'user-1',
      email: 'jose@example.com',
      role: 'CLIENT',
      name: 'José',
    });

    expect(decodeToken<{ name: string; role: string }>(token)).toMatchObject({
      name: 'José',
      role: 'CLIENT',
    });
  });

  it('returns null for a malformed token without throwing', () => {
    expect(decodeToken('not-a-jwt')).toBeNull();
    expect(decodeToken('')).toBeNull();
    expect(decodeToken('a.b')).toBeNull();
  });

  it('returns the payload even when role is missing', () => {
    const token = createUnsignedJwt({ sub: 'user-1', email: 'a@b.c' });

    expect(decodeToken<{ email: string; role?: string }>(token)).toEqual({
      sub: 'user-1',
      email: 'a@b.c',
    });
  });
});

describe('isTokenExpired', () => {
  it('returns false for a token whose exp is in the future', () => {
    const token = createUnsignedJwt({
      exp: Math.floor(Date.now() / 1000) + ONE_HOUR_IN_SECONDS,
    });

    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for a token whose exp is in the past', () => {
    const token = createUnsignedJwt({
      exp: Math.floor(Date.now() / 1000) - ONE_HOUR_IN_SECONDS,
    });

    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true when the token is malformed or has no exp', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
    expect(isTokenExpired(createUnsignedJwt({ sub: 'user-1' }))).toBe(true);
  });
});
