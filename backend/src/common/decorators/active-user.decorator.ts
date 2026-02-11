import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

export interface ActiveUserData {
  sub: string;            // User ID
  email: string;
  roleType: SystemRoleType; // PENTING: Untuk cek ADMIN/LEADER
  communityGroupId: number; // PENTING: Untuk cek dia RT mana
}

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData | undefined = request.user;
    return field ? user?.[field] : user;
  },
);