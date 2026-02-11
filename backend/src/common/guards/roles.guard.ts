import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRoleType } from '@prisma/client';
// Import ROLES_KEY dari file decorator
import { ROLES_KEY } from '../decorators/roles.decorator'; 

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRoleType[]>(
      ROLES_KEY, // Menggunakan key dari import
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Safety check
    if (!user || !user.role) {
      return false;
    }

    // Logic pengecekan role
    return requiredRoles.some((role) => user.role.type === role);
  }
}