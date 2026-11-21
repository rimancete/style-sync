import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getAuthStorageKey } from '~/utils/env';
import { decodeToken } from '~/utils/jwt.util';

export type Role = 'CLIENT' | 'STAFF' | 'ADMIN';

export type CustomerSummary = {
  id: string;
  displayId: number;
  name: string;
  urlSlug: string;
  logoUrl?: string;
};

/** Mirrors the backend `AuthResponseDto` returned by login, register and refresh. */
export type AuthResponse = {
  token: string;
  refreshToken: string;
  userId: string;
  userName: string;
  phone: string | null;
  customers: CustomerSummary[];
  defaultCustomerId?: string;
};

/** Claims signed into the access token. `role` and `email` exist nowhere else. */
type SessionClaims = {
  sub: string;
  email: string;
  role: string;
  customerIds: string[];
  defaultCustomerId?: string;
};

type PersistedSession = {
  token: string | null;
  refreshToken: string | null;
  userId: string | null;
  userName: string | null;
  phone: string | null;
  email: string | null;
  role: Role | null;
  customers: CustomerSummary[];
  defaultCustomerId: string | null;
  /** The salon (CLIENT) or company (ADMIN, STAFF) whose data the app shows. */
  activeCustomerId: string | null;
  activeCustomerSlug: string | null;
  isAuthenticated: boolean;
};

type AuthActions = {
  setSession: (auth: AuthResponse) => void;
  /** Ignores ids the user is not linked to. */
  setActiveCustomer: (customerId: string) => void;
  clearAuth: () => void;
};

type AuthState = PersistedSession & AuthActions;

type ActiveCustomer = Pick<PersistedSession, 'activeCustomerId' | 'activeCustomerSlug'>;

const STORAGE_KEY = getAuthStorageKey();

/**
 * v2 is the real API contract without an active customer; v3 adds it.
 * Older shapes (`{ user, token }`) are dropped rather than migrated.
 */
const SESSION_SCHEMA_VERSION = 3;
const ACTIVE_CUSTOMER_SCHEMA_VERSION = 2;

const ROLES: readonly string[] = ['CLIENT', 'STAFF', 'ADMIN'];

const EMPTY_SESSION: PersistedSession = {
  token: null,
  refreshToken: null,
  userId: null,
  userName: null,
  phone: null,
  email: null,
  role: null,
  customers: [],
  defaultCustomerId: null,
  activeCustomerId: null,
  activeCustomerSlug: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...EMPTY_SESSION,
      setSession: (auth) => set(toSession(auth, get().activeCustomerId)),
      setActiveCustomer: (customerId) => {
        const customer = get().customers.find(({ id }) => id === customerId);

        if (customer) {
          set({ activeCustomerId: customer.id, activeCustomerSlug: customer.urlSlug });
        }
      },
      clearAuth: () => set({ ...EMPTY_SESSION }),
    }),
    {
      name: STORAGE_KEY,
      version: SESSION_SCHEMA_VERSION,
      migrate: (persisted, version): PersistedSession => {
        if (version !== ACTIVE_CUSTOMER_SCHEMA_VERSION || !isObject(persisted)) {
          return { ...EMPTY_SESSION };
        }

        const session = { ...EMPTY_SESSION, ...persisted } as PersistedSession;
        return { ...session, ...pickInitialActiveCustomer(session) };
      },
      partialize: (state): PersistedSession => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userId: state.userId,
        userName: state.userName,
        phone: state.phone,
        email: state.email,
        role: state.role,
        customers: state.customers,
        defaultCustomerId: state.defaultCustomerId,
        activeCustomerId: state.activeCustomerId,
        activeCustomerSlug: state.activeCustomerSlug,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export function findCustomerBySlug(
  customers: CustomerSummary[],
  slug: string
): CustomerSummary | undefined {
  return customers.find(({ urlSlug }) => urlSlug === slug);
}

/**
 * A token refresh keeps the customer the user is working in. Login and
 * register start from the server default instead.
 */
function toSession(auth: AuthResponse, currentActiveId: string | null): PersistedSession {
  const claims = decodeToken<SessionClaims>(auth.token);

  const session: PersistedSession = {
    token: auth.token,
    refreshToken: auth.refreshToken,
    userId: auth.userId,
    userName: auth.userName,
    phone: auth.phone,
    email: claims?.email ?? null,
    role: toRole(claims?.role),
    customers: auth.customers,
    defaultCustomerId: auth.defaultCustomerId ?? null,
    activeCustomerId: null,
    activeCustomerSlug: null,
    isAuthenticated: true,
  };

  const current = auth.customers.find(({ id }) => id === currentActiveId);
  const active = current ? toActiveCustomer(current) : pickInitialActiveCustomer(session);

  return { ...session, ...active };
}

/**
 * A CLIENT enters through a salon, which the server returns as the default.
 * An ADMIN or STAFF with several companies has to choose one first.
 */
function pickInitialActiveCustomer(
  session: Pick<PersistedSession, 'role' | 'customers' | 'defaultCustomerId'>
): ActiveCustomer {
  const { role, customers, defaultCustomerId } = session;

  if (role === 'CLIENT') {
    const salon = customers.find(({ id }) => id === defaultCustomerId) ?? customers[0];
    return toActiveCustomer(salon);
  }

  return toActiveCustomer(customers.length === 1 ? customers[0] : undefined);
}

function toActiveCustomer(customer: CustomerSummary | undefined): ActiveCustomer {
  return {
    activeCustomerId: customer?.id ?? null,
    activeCustomerSlug: customer?.urlSlug ?? null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRole(value: unknown): Role | null {
  return typeof value === 'string' && ROLES.includes(value) ? (value as Role) : null;
}
