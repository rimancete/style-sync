export interface ApiResponse<T = unknown> {
  data: T;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface CustomerSummary {
  id: string;
  displayId: number;
  name: string;
  urlSlug: string;
  logoUrl?: string;
}

export interface AuthResponseData {
  token: string;
  userName: string;
  userId: string;
  refreshToken: string;
  phone: string | null;
  customers: CustomerSummary[]; // Available customers
  defaultCustomerId?: string; // Primary customer
}
