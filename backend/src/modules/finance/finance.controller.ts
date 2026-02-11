import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Wallet endpoints
  @Get('wallet/:userId')
  async getWallet(@Param('userId') userId: string) {
    return this.financeService.getWallet(userId);
  }

  @Get('wallet/:userId/balance')
  async getWalletBalance(@Param('userId') userId: string) {
    return this.financeService.getWalletBalance(userId);
  }

  @Post('wallet/:userId/credit')
  async creditWallet(
    @Param('userId') userId: string,
    @Body() body: { amount: number; description: string },
  ) {
    return this.financeService.creditWallet(
      userId,
      body.amount,
      body.description,
    );
  }

  @Post('wallet/:userId/debit')
  async debitWallet(
    @Param('userId') userId: string,
    @Body() body: { amount: number; description: string },
  ) {
    return this.financeService.debitWallet(
      userId,
      body.amount,
      body.description,
    );
  }

  // Transaction/Ledger endpoints
  @Get('transactions/:userId')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query() filters: any,
  ) {
    return this.financeService.getTransactionHistory(userId, filters);
  }

  @Get('transaction/:transactionId')
  async getTransaction(@Param('transactionId') transactionId: string) {
    return this.financeService.getTransaction(transactionId);
  }

  // Report endpoints
  @Get('reports/financial')
  async getFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/user/:userId/summary')
  async getUserFinancialSummary(@Param('userId') userId: string) {
    return this.financeService.getUserFinancialSummary(userId);
  }
}
