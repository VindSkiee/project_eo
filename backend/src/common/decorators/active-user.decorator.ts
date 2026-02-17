import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

export interface ActiveUserData {
  id: string;            // User ID
  email: string;
  fullName?: string;
  roleId?: number;
  roleType: SystemRoleType; // FLAT: Untuk cek ADMIN/LEADER di services
  communityGroupId: number; // PENTING: Untuk cek dia RT mana
  
  // Keep nested structure for backward compatibility with RolesGuard
  role?: {
    id: number;
    type: SystemRoleType;
  };
  communityGroup?: {
    id: number;
    wallet?: any; // For finance operations
  };
}

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData | undefined = request.user;
    return field ? user?.[field] : user;
  },
);