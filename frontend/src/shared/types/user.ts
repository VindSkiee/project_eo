// User-related type definitions

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
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
  
  // --- FITUR KEUANGAN / IURAN ---
  
  lastPaidPeriod?: string | null; 
  
  contributions?: Array<{
    id?: string;
    month: number;
    year: number;
    amount?: number | string;
    paidAt: string;
  }>;

  // 👇 TAMBAHKAN INI UNTUK MENGHILANGKAN ERROR 👇
  paymentGatewayTxs?: Array<{
    id: string;
    orderId?: string;
    amount: number | string;
    status: string;
    createdAt: string;
  }>;
}

export interface User {
  id: number;
  email: string;
  fullName?: string;
  role: string;
}
