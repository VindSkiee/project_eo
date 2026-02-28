import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
  Get
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

import { Roles } from '@common/decorators/roles.decorator'; 
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

import { FundRequestsService } from '../services/fund-requests.service';
import { RejectFundRequestDto } from '../dto/reject-fund-request.dto';
// Asumsi Anda membuat CreateFundRequestDto (berisi: amount, description, eventId?)
import { CreateFundRequestDto } from '../dto/create-fund-request.dto'; 

@Controller('fund-requests')
export class FundRequestsController {
  constructor(private readonly fundRequestsService: FundRequestsService) {}

  // ==========================================
  // 1. AJUKAN DANA TAMBAHAN (RT -> RW)
  // ==========================================
  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER) // Ketua / Bendahara RT
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFundRequest(
    @ActiveUser() user: ActiveUserData,
    @Body() createFundRequestDto: CreateFundRequestDto
  ) {
    // Service akan bertugas menghubungkan requesterGroupId (RT) ke targetGroupId (Parent / RW)
    return this.fundRequestsService.createRequest(createFundRequestDto, user);
  }

  // ==========================================
  // 2. LIHAT DAFTAR PENGAJUAN (Bisa dilihat RT/RW terkait)
  // ==========================================
  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Get()
  async getFundRequests(@ActiveUser() user: ActiveUserData) {
    // Menarik data pengajuan yang dibuat oleh grup user (RT) atau yang ditujukan ke grup user (RW)
    return this.fundRequestsService.getRequestsByGroup(user.communityGroupId);
  }

  // ==========================================
  // 2b. DETAIL PENGAJUAN DANA (single)
  // ==========================================
  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Get(':id')
  async getFundRequestById(
    @Param('id') fundRequestId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.fundRequestsService.getById(fundRequestId, user);
  }

  // ==========================================
  // 3. SETUJUI DANA TAMBAHAN (RW) — hanya TREASURER
  // ==========================================
  @Roles(SystemRoleType.TREASURER) // Hanya Bendahara RW
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveFundRequest(
    @Param('id') fundRequestId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.fundRequestsService.approveExtraFunds(fundRequestId, user);
  }

  // ==========================================
  // 4. TOLAK & AMBIL KEPUTUSAN (TAKEOVER OLEH RW) — hanya TREASURER
  // ==========================================
  @Roles(SystemRoleType.TREASURER) // Hanya Bendahara RW
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectFundRequest(
    @Param('id') fundRequestId: string,
    @Body() rejectDto: RejectFundRequestDto,
    @ActiveUser() user: ActiveUserData
  ) {
    // Fungsi cerdas yang sudah kita bahas sebelumnya (Membatalkan acara atau memaksa lanjut)
    return this.fundRequestsService.rejectExtraFunds(fundRequestId, rejectDto, user);
  }
}