import { describe, expect, it } from 'vitest';

import { getSafeInternalPath, isSafeInternalPath } from './redirect.util';

describe('isSafeInternalPath', () => {
  it('accepts a single-slash in-app path', () => {
    expect(isSafeInternalPath('/admin/bookings')).toBe(true);
    expect(isSafeInternalPath('/')).toBe(true);
  });

  it('rejects absolute, protocol-relative, javascript, and backslash paths', () => {
    expect(isSafeInternalPath('https://evil.example/phish')).toBe(false);
    expect(isSafeInternalPath('//evil.example/phish')).toBe(false);
    expect(isSafeInternalPath('/login://evil')).toBe(false);
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
    expect(isSafeInternalPath('/foo\\bar')).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath('')).toBe(false);
  });
});

describe('getSafeInternalPath', () => {
  it('falls back to / when the value is not a safe internal path', () => {
    expect(getSafeInternalPath('/user/profile')).toBe('/user/profile');
    expect(getSafeInternalPath('https://evil.example')).toBe('/');
    expect(getSafeInternalPath('javascript:alert(1)')).toBe('/');
  });
});
