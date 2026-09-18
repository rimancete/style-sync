import { describe, expect, it } from 'vitest';

import { scopeQueryKey } from './useQuery';

describe('scopeQueryKey', () => {
  it('prefixes with public when there is no customer', () => {
    expect(scopeQueryKey(['customers', 'mine'], null)).toEqual(['public', 'customers', 'mine']);
  });

  it('prefixes and isolates keys by customer id', () => {
    const tenantA = scopeQueryKey(['bookings'], 'customer-a');
    const tenantB = scopeQueryKey(['bookings'], 'customer-b');

    expect(tenantA).toEqual(['customer-a', 'bookings']);
    expect(tenantB).toEqual(['customer-b', 'bookings']);
    expect(tenantA).not.toEqual(tenantB);
  });
});
