import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SystemRoleType } from '@prisma/client';

import { Public } from '@common/decorators/public.decorator'; 
import { Roles } from '@common/decorators/roles.decorator'; 
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RequestRefundDto } from './dto/request-refund.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ==========================================
  // 1. ENDPOINT USER BISA DIAKSES SEMUA ROLE (MEMBER BISA BAYAR)
  // ==========================================

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @ActiveUser() user: ActiveUserData, 
    @Body() createTransactionDto: CreateTransactionDto
  ) {
    const orderId = createTransactionDto.orderId || `EO-PAY-${Date.now()}`;
    return this.paymentService.createTransaction(user.sub, orderId, createTransactionDto.amount);
  }

  @Get('history')
  async getPaymentHistory(@ActiveUser() user: ActiveUserData) {
    return this.paymentService.getPaymentHistory(user.sub); 
  }

  @Post('refund')
  async requestRefund(
    @ActiveUser() user: ActiveUserData, 
    @Body() requestRefundDto: RequestRefundDto
  ) {
    // Service idealnya juga butuh user.sub untuk memastikan user ini yg berhak request
    return this.paymentService.requestRefund(
      requestRefundDto.paymentId, 
      requestRefundDto.amount, 
      requestRefundDto.reason,
      user.sub
    );
  }

  // ==========================================
  // 2. ENDPOINT "ZONA ABU-ABU" (BUTUH ACTIVE USER UNTUK CEK KEPEMILIKAN)
  // ==========================================

  @Get('status/:orderId')
  async getTransactionStatus(
    @ActiveUser() user: ActiveUserData, 
    @Param('orderId') orderId: string
  ) {
    // Kita kirim user data ke service agar service bisa mengecek:
    // "Apakah user ini ADMIN? Jika ya, kasih lihat. Jika bukan, pastikan transaksi ini miliknya."
    return this.paymentService.getTransactionStatus(orderId, user);
  }

  @Get('details/:paymentId')
  async getPaymentDetails(
    @ActiveUser() user: ActiveUserData, 
    @Param('paymentId') paymentId: string
  ) {
    return this.paymentService.getPaymentDetails(paymentId, user);
  }

  @Post('cancel/:orderId')
  async cancelTransaction(
    @ActiveUser() user: ActiveUserData, 
    @Param('orderId') orderId: string
  ) {
    return this.paymentService.cancelTransaction(orderId, user);
  }

  // ==========================================
  // 3. ENDPOINT KHUSUS PENGURUS (ADMIN, TREASURER, LEADER)
  // ==========================================

  // Saya tambahkan endpoint ini karena biasanya Bendahara butuh melihat SEMUA transaksi
  @Roles(SystemRoleType.TREASURER, SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Get('all-transactions')
  async getAllTransactions() {
    return this.paymentService.getAllTransactions(); 
  }

  @Roles(SystemRoleType.TREASURER, SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Post('refund/:refundId/process')
  async processRefund(@Param('refundId') refundId: string) {
    return this.paymentService.processRefund(refundId);
  }

  // ==========================================
  // 4. ENDPOINT WEBHOOK (PUBLIC)
  // ==========================================

  @Public() 
  @Post('notification')
  @HttpCode(HttpStatus.OK)
  async handleNotification(@Body() notification: Record<string, any>) {
    return this.paymentService.handleNotification(notification);
  }
}