// Event-related type definitions

export type EventStatusType =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FUNDED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'SETTLED';

export interface EventParticipant {
  userId: string;
  eventId: string;
  role: "COMMITTEE" | "ATTENDEE" | "GUEST"; // Lebih strict daripada sekadar string
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    profileImage?: string | null;
    
    // --- TAMBAHAN BARU UNTUK BADGE ---
    roleType?: string; // "RESIDENT", "ADMIN", "LEADER", "TREASURER"
    role?: {           // Alternatif jika backend Anda mereturn object role
      type: string;
    };
    communityGroup?: {
      id: number;
      name: string;
    } | null;
  };
}

export interface EventExpense {
  id: string;
  title: string;
  amount: number | string;
  proofImage: string | null;
  isValid: boolean;
  verifiedBy?: string | null;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventApproval {
  id: number;
  stepOrder: number;
  roleSnapshot: string;
  status: string; // PENDING, APPROVED, REJECTED
  notes: string | null;
  approvedAt: string | null;
  approver?: {
    fullName: string;
  };
}

export interface EventStatusHistory {
  id: number;
  status: string;
  previousStatus?: string;
  newStatus?: string;
  reason: string | null;
  createdAt: string;
  changedBy: {
    fullName: string;
  };
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  status: EventStatusType;
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
  participants?: EventParticipant[];
  expenses?: EventExpense[];
  approvals?: EventApproval[];
  statusHistory?: EventStatusHistory[];
  receiptImages?: string[];
  resultImages?: string[];
  resultDescription?: string | null;
}

export interface FundRequestItem {
  id: string;
  amount: number | string;
  description: string;
  status: string;
  eventId?: string | null;
  requesterGroupId: number;
  targetGroupId: number;
  createdById: string;
  createdAt: string;
  requesterGroup?: { name: string; type: string };
  targetGroup?: { name: string; type: string };
  createdBy?: { fullName: string; role?: { name: string } };
  approvedBy?: { fullName: string } | null;
  event?: { title: string; status: string } | null;
}

// Settlement result from API
export interface SettleResult {
  message: string;
  resultImages: string[];
  event: EventItem;
}

// Expense report result from API
export interface ExpenseReportResult {
  message: string;
  totalExpenses: number;
  remainingAmount: number;
  receiptImages: string[];
}
