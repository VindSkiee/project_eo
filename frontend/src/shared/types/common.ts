// Common/Shared type definitions

export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: number;
    email: string;
    fullName?: string;
    role: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
