// src/services/authService.ts
import { api } from "@/lib/axios";
import type { ApiResponse, LoginResult } from "@/types/api";

export const authService = {
  // POST /auth/login (Public)
  login: async (email: string, password: string): Promise<LoginResult> => {
    // Kita menembak endpoint
    const response = await api.post<ApiResponse<LoginResult>>('/auth/login', {
      email,
      password,
    });
    
    // PENTING: Karena pakai TransformInterceptor, data asli ada di response.data.data
    // Jika Interceptor Anda TIDAK membungkus 'data', ganti jadi return response.data
    return response.data.data; 
  },

  // POST /auth/logout (Protected - Butuh Token)
  // Token otomatis terkirim via axios interceptor di header
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    // Hapus data lokal setelah sukses logout di server
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};