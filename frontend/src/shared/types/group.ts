// Group/Community-related type definitions

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
