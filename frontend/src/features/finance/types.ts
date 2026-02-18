// Finance & Fund Request type definitions

export interface WalletInfo {
  groupName: string;
  balance: number;
  lastUpdated: string | null;
}

export interface TransparencyBalance {
  rt: WalletInfo;
  rw: WalletInfo | null;
}

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

export interface Contribution {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  paidAt: string;
  paymentGatewayTxId?: string;
}

// Fund Request
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

// Dues Rule
export interface DuesRule {
  id: number;
  amount: number;
  dueDay: number;
  isActive: boolean;
  updatedAt: string;
}

export interface GroupDuesInfo {
  group: {
    id: number;
    name: string;
    type: string;
  };
  duesRule: DuesRule | null;
}

export interface DuesConfig {
  group: {
    id: number;
    name: string;
    type: string;
  };
  duesRule: DuesRule | null;
  children: GroupDuesInfo[];
}
