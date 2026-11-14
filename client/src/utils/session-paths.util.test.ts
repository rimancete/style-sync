import { describe, expect, it } from 'vitest';

import {
  getHomePath,
  getLoginPath,
  replaceSalonSlug,
  resolvePostLoginPath,
} from './session-paths.util';

const CLIENT_IN_ACME = {
  role: 'CLIENT' as const,
  activeCustomerId: 'customer-acme',
  activeCustomerSlug: 'acme',
};

const ADMIN_WITH_COMPANY = {
  role: 'ADMIN' as const,
  activeCustomerId: 'customer-acme',
  activeCustomerSlug: 'acme',
};

const ADMIN_WITHOUT_COMPANY = {
  role: 'ADMIN' as const,
  activeCustomerId: null,
  activeCustomerSlug: null,
};

describe('getLoginPath', () => {
  it('sends a CLIENT back to the active salon login', () => {
    expect(getLoginPath(CLIENT_IN_ACME)).toBe('/salon/acme/login');
  });

  it('sends everyone else to the neutral login', () => {
    expect(getLoginPath(ADMIN_WITH_COMPANY)).toBe('/login');
    expect(getLoginPath({ role: null, activeCustomerSlug: null })).toBe('/login');
  });
});

describe('getHomePath', () => {
  it('lands a CLIENT on the active salon home', () => {
    expect(getHomePath(CLIENT_IN_ACME)).toBe('/salon/acme');
  });

  it('lands an ADMIN with a company on the admin area', () => {
    expect(getHomePath(ADMIN_WITH_COMPANY)).toBe('/admin');
    expect(getHomePath({ ...ADMIN_WITH_COMPANY, role: 'STAFF' })).toBe('/admin');
  });

  it('asks an ADMIN without an active company to pick one', () => {
    expect(getHomePath(ADMIN_WITHOUT_COMPANY)).toBe('/select-company');
  });
});

describe('resolvePostLoginPath', () => {
  it('honors a CLIENT redirect inside its own salon', () => {
    expect(resolvePostLoginPath(CLIENT_IN_ACME, '/salon/acme/user')).toBe('/salon/acme/user');
  });

  it('ignores a CLIENT redirect into another salon or the admin area', () => {
    expect(resolvePostLoginPath(CLIENT_IN_ACME, '/salon/elite-beauty/user')).toBe('/salon/acme');
    expect(resolvePostLoginPath(CLIENT_IN_ACME, '/salon/acme-fake/user')).toBe('/salon/acme');
    expect(resolvePostLoginPath(CLIENT_IN_ACME, '/admin')).toBe('/salon/acme');
  });

  it('honors an ADMIN redirect inside the admin area only', () => {
    expect(resolvePostLoginPath(ADMIN_WITH_COMPANY, '/admin/bookings')).toBe('/admin/bookings');
    expect(resolvePostLoginPath(ADMIN_WITH_COMPANY, '/salon/acme')).toBe('/admin');
  });

  it('carries an admin redirect through the company picker', () => {
    expect(resolvePostLoginPath(ADMIN_WITHOUT_COMPANY, '/admin/club')).toBe(
      '/select-company?redirect=%2Fadmin%2Fclub'
    );
  });

  it('rejects unsafe redirects', () => {
    expect(resolvePostLoginPath(CLIENT_IN_ACME, 'https://evil.example')).toBe('/salon/acme');
  });
});

describe('replaceSalonSlug', () => {
  it('keeps the subroute when switching salons', () => {
    expect(replaceSalonSlug('/salon/acme/user', 'elite-beauty')).toBe('/salon/elite-beauty/user');
    expect(replaceSalonSlug('/salon/acme', 'elite-beauty')).toBe('/salon/elite-beauty');
  });

  it('falls back to the salon home outside a salon path', () => {
    expect(replaceSalonSlug('/user', 'elite-beauty')).toBe('/salon/elite-beauty');
  });
});
