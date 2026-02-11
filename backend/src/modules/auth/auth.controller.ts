import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  Get, 
  UseGuards 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public, ActiveUser } from '@common/decorators'; // Import Public Decorator

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Endpoint Publik untuk menukar Email & Password dengan Token
   */
  @Public() // <--- Menandakan endpoint ini boleh diakses tanpa token
  @Post('login')
  @HttpCode(HttpStatus.OK) // Ubah status default 201 jadi 200
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/logout
   * Endpoint Private (Butuh Token) untuk Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@ActiveUser() user: any) {
    // user.id didapat otomatis dari token via JwtStrategy -> ActiveUser Decorator
    return this.authService.logout(user.id);
  }

  /**
   * GET /auth/me
   * Endpoint untuk cek status login user (Pengganti "Page Login" di API)
   * * Frontend Logic:
   * - Saat buka App -> Request ke /auth/me
   * - Jika 200 OK -> Redirect Dashboard
   * - Jika 401 Unauthorized -> Tampilkan Form Login
   */
  @Get('me')
  async getProfile(@ActiveUser() user: any) {
    // Mengembalikan data user yang sedang login saat ini
    return {
      message: 'User session is active',
      user: user, 
    };
  }
}