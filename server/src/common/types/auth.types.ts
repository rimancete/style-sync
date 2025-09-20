import { Request } from 'express';

export type Role = 'CLIENT' | 'STAFF' | 'ADMIN';

export interface CustomerSummary {
  id: string;
  name: string;
  urlSlug: string;
  logoUrl?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  customerIds: string[]; // All accessible customers
  activeCustomerId?: string; // Current session context
  activeCustomerSlug?: string; // Current customer URL slug
  defaultCustomerId?: string; // Primary customer
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  customerIds: string[]; // All accessible customers
  defaultCustomerId?: string; // Primary customer
}
