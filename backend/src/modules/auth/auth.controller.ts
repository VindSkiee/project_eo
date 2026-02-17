import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  Get,
  Res, 
 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public, ActiveUser } from '@common/decorators'; // Import Public Decorator
import type { Response } from 'express'; // <-- Import dari express
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Endpoint Publik untuk menukar Email & Password dengan Token
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto, 
    @Res({ passthrough: true }) res: Response // <-- Gunakan @Res passthrough
  ) {
    const result = await this.authService.login(loginDto);

    // 1. Masukkan token ke dalam HttpOnly Cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true, // Tidak bisa dibaca oleh JavaScript (Anti XSS)
      secure: process.env.NODE_ENV === 'production', // Harus true jika pakai HTTPS (Production)
      sameSite: 'lax', // Keamanan tambahan
      maxAge: 1000 * 60 * 60 * 24, // Expired dalam 1 hari (sesuaikan dengan exp JWT)
    });

    // 2. Kembalikan data user saja ke frontend (tanpa token)
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@ActiveUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    
    // Hapus cookie saat logout
    res.clearCookie('accessToken');
    
    return { message: 'Logout berhasil' };
  }
}