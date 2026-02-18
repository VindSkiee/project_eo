// Event-related type definitions

export interface EventParticipant {
  userId: string;
  eventId: string;
  role: string; // COMMITTEE, ATTENDEE, GUEST
  user: {
    fullName: string;
    email: string;
    phone: string | null;
  };
}

export interface EventExpense {
  id: number;
  title: string;
  amount: number;
  proofImage: string | null;
  isValid: boolean;
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
  approver?: {
    fullName: string;
  };
}

export interface EventStatusHistory {
  id: number;
  status: string;
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
  participants?: EventParticipant[];
  expenses?: EventExpense[];
  approvals?: EventApproval[];
  statusHistory?: EventStatusHistory[];
}
