// User-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse, PaginatedResponse, UserItem } from "@/shared/types";

export const userService = {
  /** Get all users */
  getAll: async (): Promise<UserItem[]> => {
    const response = await api.get<ApiResponse<UserItem[]>>("/users");
    return response.data.data;
  },

  /** Get user by ID */
  getById: async (id: string): Promise<UserItem> => {
    const response = await api.get<ApiResponse<UserItem>>(`/users/${id}`);
    return response.data.data;
  },

  /** Get users with filters (paginated) */
  getFiltered: async (params?: {
    search?: string;
    roleType?: string;
    communityGroupId?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UserItem>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<UserItem>>>("/users", { params });
    return response.data.data;
  },

  /** Get count of users in a specific group (ADMIN/LEADER only) */
  getCountByGroup: async (groupId: number): Promise<number> => {
    const response = await api.get<ApiResponse<number>>(`/users/groups/${groupId}`);
    return response.data.data;
  },

  /** Create a new user */
  create: async (data: {
    email: string;
    fullName: string;
    password?: string;
    phone?: string;
    address?: string;
    roleType: string;
    communityGroupId?: number;
  }): Promise<UserItem> => {
    const response = await api.post<ApiResponse<UserItem>>("/users", data);
    return response.data.data;
  },

  /** Update user by ID (ADMIN/LEADER) */
  update: async (id: string, data: Partial<{
    email: string;
    fullName: string;
    phone: string;
    address: string;
    roleType: string;
    communityGroupId: number;
  }>): Promise<UserItem> => {
    const response = await api.patch<ApiResponse<UserItem>>(`/users/${id}`, data);
    return response.data.data;
  },

  /** Delete a user */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /** Get own profile (Auth required) */
  getProfile: async (): Promise<UserItem> => {
    const response = await api.get<ApiResponse<UserItem>>("/users/me");
    return response.data.data;
  },

  /** Update own profile */
  updateProfile: async (data: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<UserItem> => {
    const response = await api.patch<ApiResponse<UserItem>>("/users/profile", data);
    return response.data.data;
  },

  /** Change password */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.patch("/users/change-password", data);
  },

  /** Upload profile photo */
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<string>>("/storage/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
