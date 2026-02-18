// Event-related API operations
import { api } from "@/shared/lib/axios";
import type { ApiResponse, EventItem } from "@/shared/types";

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

  /** Approve/Reject event */
  processApproval: async (id: string, data: { status: string; notes?: string }): Promise<void> => {
    await api.post(`/events/${id}/approve`, data);
  },

  /** Cancel event */
  cancel: async (id: string): Promise<void> => {
    await api.post(`/events/${id}/cancel`);
  },

  /** Cancel event with reason */
  cancelWithReason: async (id: string, reason: string): Promise<void> => {
    await api.post(`/events/${id}/cancel`, { reason });
  },
};
