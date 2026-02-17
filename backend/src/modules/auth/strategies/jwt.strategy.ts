import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../community/repositories/users.repository';
import { Request } from 'express'; // <-- Import

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    const secret = configService.getOrThrow<string>('JWT_SECRET');
    // Kalau ENV tidak ada → aplikasi gagal start. Itu yang kita mau.

    super({
      jwtFromRequest: (req: Request) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies['accessToken'];
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Pastikan payload punya sub
    if (!payload?.sub) {
      throw new UnauthorizedException('Token tidak valid.');
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Akses ditolak: User tidak ditemukan atau non-aktif.',
      );
    }

    // Transform database structure to match ActiveUserData interface
    // Flatten the nested role object to roleType
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      roleType: user.role.type,              // ← Flatten role.type to roleType
      communityGroupId: user.communityGroupId,
      role: user.role,                        // ← Keep for RolesGuard compatibility
      communityGroup: user.communityGroup,   // ← Keep for wallet access
    };
  }
}
