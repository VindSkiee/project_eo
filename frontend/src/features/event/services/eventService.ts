// Event-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse } from "@/shared/types";
import type { EventItem, FundRequestItem, SettleResult, ExpenseReportResult } from "@/features/event/types";

export const eventService = {
  /** Get list of events */
  getAll: async (): Promise<EventItem[]> => {
    const response = await api.get<ApiResponse<EventItem[]>>("/events");
    return response.data.data;
  },

  /** Get event by ID with full details */
  getById: async (id: string): Promise<EventItem> => {
    const response = await api.get<ApiResponse<EventItem>>(`/events/${id}`);
    return response.data.data;
  },

  /** Create event */
  create: async (data: {
    data: {
      title: string;
      description: string;
      budgetEstimated: number;
      startDate?: string;
      endDate?: string;
    };
    committeeUserIds?: string[];
  }): Promise<EventItem> => {
    const response = await api.post<ApiResponse<EventItem>>("/events", data);
    return response.data.data;
  },

  /** Update event */
  update: async (id: string, data: {
    title?: string;
    description?: string;
    budgetEstimated?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<EventItem> => {
    const response = await api.patch<ApiResponse<EventItem>>(`/events/${id}`, data);
    return response.data.data;
  },

  /** Delete event */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  /** Submit event for approval (DRAFT -> SUBMITTED) */
  submit: async (id: string): Promise<void> => {
    await api.post(`/events/${id}/submit`);
  },

  /** Approve/Reject event (TREASURER only) */
  processApproval: async (id: string, data: { status: string; notes?: string }): Promise<void> => {
    await api.post(`/events/${id}/approve`, data);
  },

  /** Cancel event with reason */
  cancel: async (id: string, reason: string): Promise<void> => {
    await api.post(`/events/${id}/cancel`, { reason });
  },

  /** Submit expense report with receipt files (TREASURER, FUNDED → ONGOING) */
  submitExpenseReport: async (
    id: string,
    items: { title: string; amount: number }[],
    remainingAmount: number,
    receiptFiles: File[],
  ): Promise<ExpenseReportResult> => {
    const formData = new FormData();
    formData.append("items", JSON.stringify(items));
    formData.append("remainingAmount", String(remainingAmount));
    for (const file of receiptFiles) {
      formData.append("receipts", file);
    }
    const response = await api.post<ApiResponse<ExpenseReportResult>>(
      `/events/${id}/expense-report`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  },

  /** Extend event end date (ONGOING only) */
  extendDate: async (id: string, endDate: string): Promise<void> => {
    await api.patch(`/events/${id}/extend-date`, { endDate });
  },

  /** Settle event with report photos (Leader/Admin, COMPLETED → SETTLED) */
  settle: async (id: string, description: string, photoFiles: File[]): Promise<SettleResult> => {
    const formData = new FormData();
    formData.append("description", description);
    for (const file of photoFiles) {
      formData.append("photos", file);
    }
    const response = await api.post<ApiResponse<SettleResult>>(
      `/events/${id}/settle`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  },

  /** Get fund requests */
  getFundRequests: async (): Promise<FundRequestItem[]> => {
    const response = await api.get<ApiResponse<FundRequestItem[]>>("/fund-requests");
    return response.data.data;
  },

  /** Create fund request */
  createFundRequest: async (data: { amount: number; description: string; eventId?: string }): Promise<FundRequestItem> => {
    const response = await api.post<ApiResponse<FundRequestItem>>("/fund-requests", data);
    return response.data.data;
  },

  /** Approve fund request */
  approveFundRequest: async (id: string): Promise<void> => {
    await api.post(`/fund-requests/${id}/approve`);
  },

  /** Reject fund request */
  rejectFundRequest: async (id: string, data: { reason: string; rwDecision: string }): Promise<void> => {
    await api.post(`/fund-requests/${id}/reject`, data);
  },

  /** Request additional fund for event (Admin, FUNDED → UNDER_REVIEW) */
  requestAdditionalFund: async (id: string, data: { amount: number; description: string }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/events/${id}/request-additional-fund`, data);
    return response.data.data;
  },

  /** Review additional fund request (RW Treasurer, UNDER_REVIEW → FUNDED) */
  reviewAdditionalFund: async (
    id: string,
    data: { approved: boolean; approvedAmount?: number; reason?: string }
  ): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/events/${id}/review-additional-fund`, data);
    return response.data.data;
  },
};
