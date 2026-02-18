// Payment-related type definitions

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
