import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. Cek apakah route tujuan punya stempel @Public?
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Cek di level function handler
      context.getClass(),   // Cek di level class controller
    ]);

    // 2. Jika ada stempel Public, izinkan lewat (return true)
    if (isPublic) {
      return true;
    }

    // 3. Jika tidak Public, panggil logika validasi standar bawaan Passport-JWT
    // Ini akan otomatis memanggil JwtStrategy.validate() yang nanti kita buat
    return super.canActivate(context);
  }
}