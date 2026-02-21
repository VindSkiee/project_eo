// Settings-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types";

export interface RoleLabelItem {
  id: number;
  roleType: string;
  label: string;
  communityGroupId: number;
  createdAt: string;
  updatedAt: string;
}

export const settingsService = {
  /** Get all custom role labels (LEADER management) */
  getRoleLabels: async (): Promise<RoleLabelItem[]> => {
    const response = await api.get<ApiResponse<RoleLabelItem[]>>("/settings/role-labels");
    return response.data.data;
  },

  /** Get role labels as a map { ROLE: "label" } (all users) */
  getRoleLabelsMap: async (): Promise<Record<string, string>> => {
    const response = await api.get<ApiResponse<Record<string, string>>>("/settings/role-labels/map");
    return response.data.data;
  },

  /** Create or update a role label */
  upsertRoleLabel: async (data: { roleType: string; label: string }): Promise<RoleLabelItem> => {
    const response = await api.post<ApiResponse<RoleLabelItem>>("/settings/role-labels", data);
    return response.data.data;
  },

  /** Delete a role label (revert to default) */
  deleteRoleLabel: async (roleType: string): Promise<void> => {
    await api.delete(`/settings/role-labels/${roleType}`);
  },
};
