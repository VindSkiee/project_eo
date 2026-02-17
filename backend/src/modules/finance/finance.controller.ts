import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

// Decorators
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

// Services
import { FinanceService } from './services/finance.service';
import { DuesService } from './services/dues.service';

// DTOs
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { SetDuesDto } from './dto/set-dues.dto';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly duesService: DuesService,
  ) { }

  // ==========================================
  // 1. MANAJEMEN DOMPET & KAS (Khusus Pengurus)
  // ==========================================

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Get('wallet')
  @HttpCode(HttpStatus.OK)
  async getWalletDetails(@ActiveUser() user: ActiveUserData) {
    // Bendahara melihat saldo dompet grupnya sendiri
    return this.financeService.getWalletDetails(user.communityGroupId);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactionHistory(@ActiveUser() user: ActiveUserData) {
    // Bendahara melihat mutasi rekening koran (history)
    return this.financeService.getTransactionHistory(user.communityGroupId);
  }

  @Roles(SystemRoleType.TREASURER, SystemRoleType.LEADER) // Admin RT tidak boleh pegang uang tunai (Opsional)
  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createManualTransaction(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: CreateManualTransactionDto
  ) {
    // Input pengeluaran tunai / belanja ATK / sumbangan offline
    return this.financeService.createManualTransaction(dto, user);
  }

  // ==========================================
  // 2. MANAJEMEN IURAN & TAGIHAN (Dues)
  // ==========================================

  // A. Setting Harga (Hanya Ketua & Bendahara)
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER, SystemRoleType.TREASURER)
  @Post('dues/config')
  @HttpCode(HttpStatus.OK)
  async setDuesConfig(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: SetDuesDto
  ) {
    // Contoh: RT 01 set harga 15.000
    return this.duesService.setDuesRule(dto, user);
  }

  @Roles(SystemRoleType.RESIDENT)
  @Get('dues/my-bill')
  @HttpCode(HttpStatus.OK)
  async getMyBill(@ActiveUser() user: ActiveUserData) {
    // Logic cerdas yang memisahkan jatah RT dan RW
    // Output: { total: 30000, breakdown: [{RT: 15000}, {RW: 15000}] }
    return this.duesService.getMyBill(user);
  }

  // A. Cek Saldo RT & RW
  // Endpoint: GET /finance/transparency/balance
  @Roles(SystemRoleType.RESIDENT, SystemRoleType.ADMIN, SystemRoleType.LEADER, SystemRoleType.TREASURER)
  @Get('transparency/balance')
  @HttpCode(HttpStatus.OK)
  async getPublicBalance(@ActiveUser() user: ActiveUserData) {
    return this.financeService.getTransparencyBalance(user);
  }

  // B. Cek Riwayat Transaksi
  // Endpoint: GET /finance/transparency/history?scope=RT
  // Endpoint: GET /finance/transparency/history?scope=RW
  @Roles(SystemRoleType.RESIDENT, SystemRoleType.ADMIN, SystemRoleType.LEADER, SystemRoleType.TREASURER)
  @Get('transparency/history')
  @HttpCode(HttpStatus.OK)
  async getPublicHistory(
    @ActiveUser() user: ActiveUserData,
    @Query('scope') scope: 'RT' | 'RW' = 'RT' // Default lihat RT sendiri
  ) {
    return this.financeService.getTransparencyHistory(user, scope);
  }
}