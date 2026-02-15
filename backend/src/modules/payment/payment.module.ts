import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import midtransConfig from '../../config/midtrans.config';
import { PaymentRepository } from './payment.repository';
import { FinanceModule } from '@modules/finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [midtransConfig], // <--- MASUKKAN DI SINI
    }),
    FinanceModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
