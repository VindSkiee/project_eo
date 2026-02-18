// Payment-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse, PaymentItem } from "@/shared/types";

export const paymentService = {
  /** Get all payment transactions (LEADER/ADMIN/TREASURER) */
  getAll: async (): Promise<PaymentItem[]> => {
    const response = await api.get<ApiResponse<PaymentItem[]>>("/payment/all-transactions");
    return response.data.data;
  },

  /** Get payment history for self */
  getHistory: async (): Promise<PaymentItem[]> => {
    const response = await api.get<ApiResponse<PaymentItem[]>>("/payment/history");
    return response.data.data;
  },

  /** Process refund */
  processRefund: async (refundId: string): Promise<void> => {
    await api.post(`/payment/refund/${refundId}/process`);
  },
};
