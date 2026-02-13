import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from '@nestjs/core'; 

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import midtransConfig from './config/midtrans.config';

// Global Modules
import { PrismaModule } from './database/prisma.module';
import { MailModule } from './providers/mail/mail.module';
import { StorageModule } from './providers/storage/storage.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { CommunityModule } from './modules/community/community.module';
import { EventsModule } from './modules/events/events.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PaymentModule } from './modules/payment/payment.module';

// Global Providers
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // Import Filter Anda
import { RolesGuard } from '@common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, midtransConfig],
    }),
    PrismaModule,
    MailModule,
    StorageModule,
    AuthModule,
    CommunityModule,
    EventsModule,
    FinanceModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    
    // 1. GLOBAL GUARD (Keamanan - Default Secure)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    {
    provide: APP_GUARD,
    useClass: RolesGuard, 
  },
    
    // 2. GLOBAL INTERCEPTOR (Format Response Sukses)
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // 3. GLOBAL VALIDATION PIPE (Validasi DTO) -- WAJIB ADA
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Hapus properti JSON yang tidak ada di DTO (Security)
        forbidNonWhitelisted: true, // Error jika user kirim field sampah
        transform: true, // Otomatis ubah tipe data (misal string "1" jadi number 1)
      }),
    },

    // 4. GLOBAL EXCEPTION FILTER (Format Error)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, 
    },
  ],
})
export class AppModule {}