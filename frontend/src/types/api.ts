// src/types/api.ts

// 1. Structure Response Global (Akibat TransformInterceptor)
export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T; // Data asli ada di dalam properti 'data'
}

// 2. Data User (Sesuaikan field yang Anda return di authService.login)
export interface User {
  id: number; // atau string, sesuaikan dengan database
  email: string;
  fullName?: string;
  role: string;
}

// 3. Data Login Result
export interface LoginResult {
  accessToken: string;
  user: User;
}