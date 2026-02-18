import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // <-- SANGAT PENTING: Mengizinkan pengiriman & penerimaan Cookie
});

// Interceptor Request: Dihapus! Browser otomatis mengirim HttpOnly cookie

// Interceptor Response: Tetap dipertahankan untuk menendang user jika token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika backend menolak (Token Expired / Tidak Valid / Role dipalsukan)
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('user'); // Hapus flag login
      window.location.href = '/login'; // Tendang ke halaman login
    }
    return Promise.reject(error);
  }
);