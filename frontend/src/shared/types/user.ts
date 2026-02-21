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
}

export interface User {
  id: number;
  email: string;
  fullName?: string;
  role: string;
}
