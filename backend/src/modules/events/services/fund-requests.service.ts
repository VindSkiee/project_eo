import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service'; 
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { FundRequestStatus, EventStatus, SystemRoleType } from '@prisma/client';
import { CreateFundRequestDto } from '../dto/create-fund-request.dto';
import { RejectFundRequestDto, RwTakeoverDecision } from '../dto/reject-fund-request.dto';
// 👇 1. IMPORT FINANCE SERVICE
import { FinanceService } from '../../finance/services/finance.service';

@Injectable()
export class FundRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService // 👈 2. INJECT DI SINI
  ) {}

  // ==========================================
  // 1. AJUKAN DANA TAMBAHAN (RT minta ke RW)
  // ==========================================
  async createRequest(dto: CreateFundRequestDto, user: ActiveUserData) {
    const requesterGroup = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
    });

    if (!requesterGroup) throw new NotFoundException('Grup komunitas tidak ditemukan');

    if (!requesterGroup.parentId) {
      throw new ForbiddenException('Grup tingkat atas (RW) tidak dapat mengajukan dana melalui sistem ini');
    }

    if (dto.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Acara (Event) tidak ditemukan');
      if (event.communityGroupId !== user.communityGroupId) {
        throw new ForbiddenException('Anda tidak bisa meminta dana untuk acara milik lingkungan lain');
      }
    }

    return this.prisma.fundRequest.create({
      data: {
        requesterGroupId: requesterGroup.id,
        targetGroupId: requesterGroup.parentId,
        amount: dto.amount,
        description: dto.description,
        eventId: dto.eventId,
        createdById: user.id,
        status: FundRequestStatus.PENDING,
      }
    });
  }

  // ==========================================
  // 2. LIHAT DAFTAR PENGAJUAN
  // ==========================================
  async getRequestsByGroup(communityGroupId: number) {
    return this.prisma.fundRequest.findMany({
      where: {
        OR: [
          { requesterGroupId: communityGroupId },
          { targetGroupId: communityGroupId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requesterGroup: { select: { name: true, type: true } },
        targetGroup: { select: { name: true, type: true } },
        createdBy: { select: { fullName: true, role: { select: { name: true } } } },
        approvedBy: { select: { fullName: true } },
        event: { select: { title: true, status: true } } 
      }
    });
  }

  // ==========================================
  // 3. SETUJUI DANA TAMBAHAN (RW -> Transfer ke RT)
  // ==========================================
  async approveExtraFunds(fundRequestId: string, user: ActiveUserData) {
    const fundReq = await this.prisma.fundRequest.findUnique({ 
      where: { id: fundRequestId } 
    });

    if (!fundReq) throw new NotFoundException('Pengajuan dana tidak ditemukan');
    if (fundReq.status !== FundRequestStatus.PENDING) {
      throw new BadRequestException('Pengajuan dana ini sudah diproses sebelumnya');
    }

    if (user.communityGroupId !== fundReq.targetGroupId) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk menyetujui pengajuan ini');
    }

    return this.prisma.$transaction(async (tx) => {
      // A. Update status menjadi disetujui
      const approvedRequest = await tx.fundRequest.update({
        where: { id: fundRequestId },
        data: { 
          status: FundRequestStatus.APPROVED,
          approvedById: user.id
        }
      });

      // B. 👇 INTEGRASI FINANCE: PINDAHKAN UANG REAL
      // Dari Wallet RW (Target) -> Ke Wallet RT (Requester)
      await this.financeService.transferInterGroup(
        fundReq.targetGroupId,    // Pengirim (RW)
        fundReq.requesterGroupId, // Penerima (RT)
        Number(fundReq.amount),   // Nominal
        `Penyetujuan Dana Tambahan: ${fundReq.description}`
      );
      
      console.log(`[SYSTEM] Transfer Rp${fundReq.amount} dari RW ke RT berhasil.`);

      // C. Catat di riwayat acara (Jika ada)
      if (fundReq.eventId) {
        const currentEvent = await tx.event.findUnique({ where: { id: fundReq.eventId } });
        if (currentEvent) {
          await tx.eventStatusHistory.create({
            data: {
              eventId: fundReq.eventId,
              changedById: user.id,
              previousStatus: currentEvent.status,
              newStatus: currentEvent.status,
              reason: `Pengajuan dana tambahan sebesar Rp${fundReq.amount} telah disetujui oleh RW.`
            }
          });
        }
      }

      return approvedRequest;
    });
  }

  // ==========================================
  // 4. TOLAK & AMBIL KEPUTUSAN (RW -> Mungkin Refund)
  // ==========================================
  async rejectExtraFunds(fundRequestId: string, dto: RejectFundRequestDto, user: ActiveUserData) {
    const fundReq = await this.prisma.fundRequest.findUnique({
      where: { id: fundRequestId },
      include: { event: true } 
    });

    if (!fundReq) throw new NotFoundException('Pengajuan dana tidak ditemukan');
    if (fundReq.status !== FundRequestStatus.PENDING) throw new BadRequestException('Sudah diproses');
    if (user.communityGroupId !== fundReq.targetGroupId) throw new ForbiddenException('Tidak memiliki hak akses');

    return this.prisma.$transaction(async (tx) => {
      // A. Update status menjadi ditolak
      await tx.fundRequest.update({
        where: { id: fundRequestId },
        data: { status: FundRequestStatus.REJECTED, approvedById: user.id }
      });

      if (!fundReq.eventId || !fundReq.event) {
        return { message: 'Pengajuan dana operasional ditolak oleh RW' };
      }

      // B. Logika Takeover
      if (dto.rwDecision === RwTakeoverDecision.CANCEL_EVENT) {
        await tx.event.update({
          where: { id: fundReq.eventId },
          data: { status: EventStatus.CANCELLED }
        });

        await tx.eventStatusHistory.create({
          data: {
            eventId: fundReq.eventId,
            changedById: user.id,
            previousStatus: fundReq.event.status,
            newStatus: EventStatus.CANCELLED,
            reason: `[DANA DITOLAK]: ${dto.reason}. RW mengambil keputusan untuk MEMBATALKAN acara.`
          }
        });

        // 👇 INTEGRASI FINANCE: REFUND UANG (Hanya jika uang sudah cair sebelumnya)
        // Jika status sebelumnya FUNDED atau ONGOING, berarti uang RT sudah terpakai/cair.
        // Kita harus kembalikan ke kas RT (atau tarik paksa, tergantung kebijakan,
        // tapi logic refundEventFund kita adalah "Masukin uang ke kas RT").
        // Asumsinya: RW membatalkan, uang sisa di panitia ditarik balik ke Kas RT.
        const refundableStatuses: EventStatus[] = [EventStatus.FUNDED, EventStatus.ONGOING];

        if (refundableStatuses.includes(fundReq.event.status)) {
            await this.financeService.refundEventFund(
                fundReq.event.communityGroupId,
                Number(fundReq.event.budgetEstimated), 
                fundReq.eventId,
                'Pembatalan paksa oleh RW via Penolakan Dana Tambahan'
            );
            console.log(`[SYSTEM] Refund dana acara akibat pembatalan paksa.`);
        }

        return { message: 'Dana ditolak dan Acara berhasil DIBATALKAN.' };

      } else if (dto.rwDecision === RwTakeoverDecision.CONTINUE_WITH_ORIGINAL) {
        await tx.eventStatusHistory.create({
          data: {
            eventId: fundReq.eventId,
            changedById: user.id,
            previousStatus: fundReq.event.status,
            newStatus: fundReq.event.status,
            reason: `[DANA DITOLAK]: ${dto.reason}. RW memerintahkan acara TETAP BERJALAN dengan anggaran awal.`
          }
        });

        return { message: 'Dana ditolak, Acara tetap dilanjutkan dengan anggaran awal.' };
      }
    });
  }
}