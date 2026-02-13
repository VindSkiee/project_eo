import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <--- 1. Import ini
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- 2. Import ini
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommunityModule } from '../community/community.module'; // Sesuaikan path jika perlu
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    CommunityModule, // Ini sudah benar (menyediakan UsersRepository)
    PassportModule,
    // --- 3. TAMBAHKAN KONFIGURASI JWT DI SINI ---
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Pastikan Anda punya variable JWT_SECRET di file .env
        secret: configService.get<string>('JWT_SECRET') || 'RAHASIA_NEGARA_SEMENTARA', 
        signOptions: { 
          expiresIn: '1d' // Token berlaku 1 hari
        },
      }),
    }),
    // ---------------------------------------------
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}