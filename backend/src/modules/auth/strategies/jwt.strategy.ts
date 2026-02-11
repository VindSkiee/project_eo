import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../community/repositories/users.repository'; // Pastikan path import sesuai

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersRepository: UsersRepository, // Inject Repository, bukan Service/Prisma
  ) {
    super({
      // 1. Cara ambil token: Dari Header 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Cek Expiration: Jika token expired, request langsung ditolak (401)
      ignoreExpiration: false,
      
      // 3. Secret Key: Ambil dari ENV via ConfigService agar aman
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key',
    });
  }

  /**
   * Method ini otomatis dipanggil SETELAH token lolos verifikasi tanda tangan (signature).
   * Tugas kita di sini adalah memastikan User pemilik token masih ada di Database.
   */
  async validate(payload: any) {
    // payload.sub = User ID (diset saat login di AuthService)
    const user = await this.usersRepository.findById(payload.sub);

    // SECURITY CHECK:
    // Jika user dihapus oleh Admin saat token masih hidup, ini akan memblokirnya.
    if (!user) {
      throw new UnauthorizedException('Akses ditolak: User tidak ditemukan atau non-aktif.');
    }

    // Sanitasi: Buang field password sebelum data user ditempel ke Request
    // @ts-ignore
    const { password, ...result } = user;

    // Return value ini akan otomatis tersedia di `request.user`
    // Dan bisa diambil lewat decorator @ActiveUser()
    return result;
  }
}