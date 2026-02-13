import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import midtransConfig from '../../config/midtrans.config';
import { PaymentRepository } from './payment.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [midtransConfig], // <--- MASUKKAN DI SINI
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
