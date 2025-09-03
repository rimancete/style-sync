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
  user_name: string;
  user_id: string;
  refresh_token: string;
  phone: string | null;
}
