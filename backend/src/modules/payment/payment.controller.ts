import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() createPaymentDto: any) {
    return this.paymentService.createTransaction(
      createPaymentDto.orderId,
      createPaymentDto.amount,
      createPaymentDto.customerDetails,
    );
  }

  @Get('status/:orderId')
  async getTransactionStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getTransactionStatus(orderId);
  }

  @Post('cancel/:orderId')
  async cancelTransaction(@Param('orderId') orderId: string) {
    return this.paymentService.cancelTransaction(orderId);
  }

  @Post('notification')
  @HttpCode(HttpStatus.OK)
  async handleNotification(@Body() notification: any) {
    return this.paymentService.handleNotification(notification);
  }

  @Get('history/:userId')
  async getPaymentHistory(@Param('userId') userId: string) {
    return this.paymentService.getPaymentHistory(userId);
  }

  @Get('details/:paymentId')
  async getPaymentDetails(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentDetails(paymentId);
  }

  @Post('refund')
  async requestRefund(@Body() refundDto: any) {
    return this.paymentService.requestRefund(
      refundDto.paymentId,
      refundDto.amount,
      refundDto.reason,
    );
  }

  @Post('refund/:refundId/process')
  async processRefund(@Param('refundId') refundId: string) {
    return this.paymentService.processRefund(refundId);
  }
}
