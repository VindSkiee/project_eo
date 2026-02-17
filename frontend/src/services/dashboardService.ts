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
    role?: {
      id: number;
      name: string;
      type: string;
    };
  };
  communityGroup?: {
    name: string;
    type: string;
    parentId: number | null;
  };
  participants?: Array<{
    userId: string;
    eventId: string;
    role: string; // COMMITTEE, ATTENDEE, GUEST
    user: {
      fullName: string;
      email: string;
      phone: string | null;
    };
  }>;
  expenses?: Array<{
    id: number;
    title: string;
    amount: number;
    proofImage: string | null;
    isValid: boolean;
    eventId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  approvals?: Array<{
    id: number;
    stepOrder: number;
    roleSnapshot: string;
    status: string; // PENDING, APPROVED, REJECTED
    notes: string | null;
    approver?: {
      fullName: string;
    };
  }>;
  statusHistory?: Array<{
    id: number;
    status: string;
    reason: string | null;
    createdAt: string;
    changedBy: {
      fullName: string;
    };
  }>;
}

export interface GroupItem {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

// Wallet details from GET /finance/wallet
export interface WalletDetail {
  id: number;
  balance: number;
  communityGroup: {
    id: number;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Transaction from GET /finance/transactions
export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  walletId: number;
  createdAt: string;
  createdBy?: {
    fullName: string;
  };
}

// Fund request from GET /fund-requests
export interface FundRequest {
  id: string;
  amount: number;
  description: string;
  status: string;
  reason?: string;
  eventId?: string;
  event?: {
    title: string;
  };
  communityGroupId: number;
  communityGroup?: {
    name: string;
  };
  requestedBy?: {
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// User item from GET /users
export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  roleType: string;
  role?: { type: string };
  communityGroupId: number | null;
  communityGroup?: {
    id: number;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Payment item from GET /payment/all-transactions
export interface PaymentItem {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  grossAmount: number;
  status: string;
  snapToken?: string;
  redirectUrl?: string;
  midtransId?: string;
  methodCategory?: string;
  providerCode?: string;
  vaNumber?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

// Contribution / Dues record
export interface Contribution {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  paidAt: string;
  paymentGatewayTxId?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
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

  // === LEADER-SPECIFIC ENDPOINTS ===

  /** Get wallet details (LEADER/TREASURER/ADMIN) */
  getWalletDetails: async (): Promise<WalletDetail> => {
    const response = await api.get<ApiResponse<WalletDetail>>("/finance/wallet");
    return response.data.data;
  },

  /** Get transaction history */
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<ApiResponse<Transaction[]>>("/finance/transactions");
    return response.data.data;
  },

  /** Create manual transaction */
  createTransaction: async (data: { amount: number; type: string; description: string }): Promise<Transaction> => {
    const response = await api.post<ApiResponse<Transaction>>("/finance/transactions", data);
    return response.data.data;
  },

  /** Get all users */
  getUsers: async (): Promise<UserItem[]> => {
    const response = await api.get<ApiResponse<UserItem[]>>("/users");
    return response.data.data;
  },

  /** Create a new user */
  createUser: async (data: {
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

  /** Delete a user */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /** Get fund requests */
  getFundRequests: async (): Promise<FundRequest[]> => {
    const response = await api.get<ApiResponse<FundRequest[]>>("/fund-requests");
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

  /** Approve/Reject event */
  processEventApproval: async (id: string, data: { status: string; notes?: string }): Promise<void> => {
    await api.post(`/events/${id}/approve`, data);
  },

  /** Cancel event */
  cancelEvent: async (id: string): Promise<void> => {
    await api.post(`/events/${id}/cancel`);
  },

  /** Create group */
  createGroup: async (data: { name: string; type: string }): Promise<GroupItem> => {
    const response = await api.post<ApiResponse<GroupItem>>("/groups", data);
    return response.data.data;
  },

  /** Delete group */
  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  /** Get all payment transactions (LEADER/ADMIN/TREASURER) */
  getAllPayments: async (): Promise<PaymentItem[]> => {
    const response = await api.get<ApiResponse<PaymentItem[]>>("/payment/all-transactions");
    return response.data.data;
  },

  /** Get payment history for self */
  getPaymentHistory: async (): Promise<PaymentItem[]> => {
    const response = await api.get<ApiResponse<PaymentItem[]>>("/payment/history");
    return response.data.data;
  },

  /** Process refund */
  processRefund: async (refundId: string): Promise<void> => {
    await api.post(`/payment/refund/${refundId}/process`);
  },

  // === USER DETAIL & PROFILE ENDPOINTS ===

  /** Get user by ID */
  getUserById: async (id: string): Promise<UserItem> => {
    const response = await api.get<ApiResponse<UserItem>>(`/users/${id}`);
    return response.data.data;
  },

  /** Update user by ID (ADMIN/LEADER) */
  updateUser: async (id: string, data: Partial<{
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

  /** Get users with filters (paginated) */
  getUsersFiltered: async (params?: {
    search?: string;
    roleType?: string;
    communityGroupId?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UserItem>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<UserItem>>>("/users", { params });
    return response.data.data;
  },

  /** Get own profile (Auth required) */
  getProfile: async (): Promise<UserItem> => {
    // 👇 Ganti endpoint ke '/users/me' sesuai backend NestJS
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

  /** Upload profile photo (assumed endpoint) */
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<string>>("/storage/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  /** Update group (PATCH /groups/:id) */
  updateGroup: async (id: number, data: Partial<{ name: string; type: string }>): Promise<GroupItem> => {
    const response = await api.patch<ApiResponse<GroupItem>>(`/groups/${id}`, data);
    return response.data.data;
  },

  /** Get single group with details */
  getGroupById: async (id: number): Promise<GroupItem & { wallet?: WalletDetail; children?: GroupItem[] }> => {
    const response = await api.get<ApiResponse<GroupItem & { wallet?: WalletDetail; children?: GroupItem[] }>>(`/groups/${id}`);
    return response.data.data;
  },

  /** Create event */
  createEvent: async (data: {
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

  /** Get event by ID with full details */
  getEventById: async (id: string): Promise<EventItem> => {
    const response = await api.get<ApiResponse<EventItem>>(`/events/${id}`);
    return response.data.data;
  },

  /** Update event */
  updateEvent: async (id: string, data: {
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
  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  /** Cancel event with reason */
  cancelEventWithReason: async (id: string, reason: string): Promise<void> => {
    await api.post(`/events/${id}/cancel`, { reason });
  },

  /** Get transparency transaction history */
  getTransparencyHistory: async (scope?: "RT" | "RW"): Promise<Transaction[]> => {
    const response = await api.get<ApiResponse<Transaction[]>>("/finance/transparency/history", {
      params: scope ? { scope } : {},
    });
    return response.data.data;
  },
};
