import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../community/repositories/users.repository';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository, // Inject Repository, bukan Prisma
    private readonly jwtService: JwtService,
  ) {}

  /**
   * LOGIN LOGIC
   * 1. Cari user by email (via Repository)
   * 2. Validasi password (bcrypt)
   * 3. Generate JWT Token
   */
  async login(dto: LoginDto) {
    // 1. Ambil data user mentah (termasuk password) dari Repository
    const user = await this.usersRepository.findByEmail(dto.email);

    // 2. Validasi: User harus ada DAN password harus cocok
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 3. Buat Payload Token
    // Data ini yang akan terbaca saat token di-decode (misal di JwtStrategy)
    const payload = {
      sub: user.id,              // Subject (User ID)
      email: user.email,
      role: user.role.type,      // Role (ADMIN, RESIDENT, dll)
      groupId: user.communityGroupId, // ID RT/RW
    };

    // 4. Return Token + Data User (Sanitized)
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.type,
        profileImage: user.profileImage,
        communityGroupId: user.communityGroupId,
      },
    };
  }

  /**
   * LOGOUT LOGIC
   * Karena JWT bersifat Stateless, server tidak menyimpan session aktif.
   * Logout sepenuhnya ditangani di client-side (hapus token dari localStorage/Cookie).
   *
   * Namun, method ini disediakan untuk persiapan jika nanti Anda ingin:
   * 1. Implementasi Redis Blacklist (mematikan token sebelum expired).
   * 2. Audit Log (mencatat kapan user logout).
   */
  async logout(userId: string) {
    // TODO Future: Masukkan token ke Redis Blacklist
    // await this.redisService.set(`blacklist:${token}`, 'true', 'EX', expiresIn);
    
    return {
      message: 'Logout berhasil. Silakan hapus token dari sisi client.',
    };
  }
}