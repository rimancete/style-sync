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
  isAuthenticated: boolean;
};

type AuthActions = {
  setSession: (auth: AuthResponse) => void;
  clearAuth: () => void;
};

type AuthState = PersistedSession & AuthActions;

const STORAGE_KEY = getAuthStorageKey();

/**
 * Bumped from the implicit v0 shape (`{ user, token }`) that predates the real
 * API contract. Anything older is dropped rather than migrated.
 */
const SESSION_SCHEMA_VERSION = 2;

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
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...EMPTY_SESSION,
      setSession: (auth) => set(toSession(auth)),
      clearAuth: () => set({ ...EMPTY_SESSION }),
    }),
    {
      name: STORAGE_KEY,
      version: SESSION_SCHEMA_VERSION,
      migrate: (): PersistedSession => ({ ...EMPTY_SESSION }),
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

function toSession(auth: AuthResponse): PersistedSession {
  const claims = decodeToken<SessionClaims>(auth.token);

  return {
    token: auth.token,
    refreshToken: auth.refreshToken,
    userId: auth.userId,
    userName: auth.userName,
    phone: auth.phone,
    email: claims?.email ?? null,
    role: toRole(claims?.role),
    customers: auth.customers,
    defaultCustomerId: auth.defaultCustomerId ?? null,
    isAuthenticated: true,
  };
}

function toRole(value: unknown): Role | null {
  return typeof value === 'string' && ROLES.includes(value) ? (value as Role) : null;
}
