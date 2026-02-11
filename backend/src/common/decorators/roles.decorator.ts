import { SetMetadata } from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Cara pakainya nanti: @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER)
export const Roles = (...roles: SystemRoleType[]) => SetMetadata(ROLES_KEY, roles);