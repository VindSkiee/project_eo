import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

// === TYPES ===

export interface WalletInfo {
  groupName: string;
  balance: number;
  lastUpdated: string | null;
}

export interface TransparencyBalance {
  rt: WalletInfo;
  rw: WalletInfo | null;
}

export interface BillBreakdown {
  type: string;
  groupName: string;
  amount: number;
  destinationWalletId: number;
}

export interface MyBill {
  totalAmount: number;
  currency: string;
  breakdown: BillBreakdown[];
  dueDateDescription: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetEstimated: string;
  budgetActual: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  communityGroupId: number;
  createdById: string;
  createdBy?: {
    fullName: string;
  };
}

export interface GroupItem {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

// === API CALLS ===

export const dashboardService = {
  /** Get RT & RW wallet balance (transparency endpoint) */
  getTransparencyBalance: async (): Promise<TransparencyBalance> => {
    const response = await api.get<ApiResponse<TransparencyBalance>>(
      "/finance/transparency/balance"
    );
    return response.data.data;
  },

  /** Get personal bill for logged-in resident */
  getMyBill: async (): Promise<MyBill> => {
    const response = await api.get<ApiResponse<MyBill>>(
      "/finance/dues/my-bill"
    );
    return response.data.data;
  },

  /** Get list of events */
  getEvents: async (): Promise<EventItem[]> => {
    const response = await api.get<ApiResponse<EventItem[]>>("/events");
    return response.data.data;
  },

  /** Get list of groups (organizations) */
  getGroups: async (): Promise<GroupItem[]> => {
    const response = await api.get<ApiResponse<GroupItem[]>>("/groups");
    return response.data.data;
  },
};
