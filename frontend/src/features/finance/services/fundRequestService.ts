// Fund request-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse, FundRequest } from "@/shared/types";

export const fundRequestService = {
  /** Get fund requests */
  getAll: async (): Promise<FundRequest[]> => {
    const response = await api.get<ApiResponse<FundRequest[]>>("/fund-requests");
    return response.data.data;
  },

  /** Create fund request (RT TREASURER → RW) */
  create: async (data: { amount: number; description: string; eventId?: string }): Promise<FundRequest> => {
    const response = await api.post<ApiResponse<FundRequest>>("/fund-requests", data);
    return response.data.data;
  },

  /** Approve fund request */
  approve: async (id: string): Promise<void> => {
    await api.post(`/fund-requests/${id}/approve`);
  },

  /** Reject fund request */
  reject: async (id: string, data: { reason: string; rwDecision: string }): Promise<void> => {
    await api.post(`/fund-requests/${id}/reject`, data);
  },
};
