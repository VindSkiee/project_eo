// Group/Community-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse, GroupItem, WalletDetail, HierarchyData } from "@/shared/types";

export const groupService = {
  /** Get list of groups (organizations) */
  getAll: async (): Promise<GroupItem[]> => {
    const response = await api.get<ApiResponse<GroupItem[]>>("/groups");
    return response.data.data;
  },

  /** Get single group with details */
  getById: async (id: number): Promise<GroupItem & { wallet?: WalletDetail; children?: GroupItem[] }> => {
    const response = await api.get<ApiResponse<GroupItem & { wallet?: WalletDetail; children?: GroupItem[] }>>(`/groups/${id}`);
    return response.data.data;
  },

  /** Create group */
  create: async (data: { name: string; type: string }): Promise<GroupItem> => {
    const response = await api.post<ApiResponse<GroupItem>>("/groups", data);
    return response.data.data;
  },

  /** Update group (PATCH /groups/:id) */
  update: async (id: number, data: Partial<{ name: string; type: string }>): Promise<GroupItem> => {
    const response = await api.patch<ApiResponse<GroupItem>>(`/groups/${id}`, data);
    return response.data.data;
  },

  /** Delete group */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  /** Get hierarchy (RW + all RT groups with officers) */
  getHierarchy: async (): Promise<HierarchyData> => {
    const response = await api.get<ApiResponse<HierarchyData>>("/groups/hierarchy");
    return response.data.data;
  },
};
