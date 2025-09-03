import { Request } from 'express';

export type Role = 'CLIENT' | 'STAFF' | 'ADMIN';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
