export interface ApiResponse<T = unknown> {
  data: T;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponseData {
  token: string;
  userName: string;
  userId: string;
  refreshToken: string;
  phone: string | null;
}
