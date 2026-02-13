import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service'; // Sesuaikan path jika berbeda
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { FundRequestStatus, EventStatus, SystemRoleType } from '@prisma/client';
import { CreateFundRequestDto } from '../dto/create-fund-request.dto';
import { RejectFundRequestDto, RwTakeoverDecision } from '../dto/reject-fund-request.dto';

@Injectable()
export class FundRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. AJUKAN DANA TAMBAHAN (RT minta ke RW)
  // ==========================================
  async createRequest(dto: CreateFundRequestDto, user: ActiveUserData) {
    // Cari data Grup asal (RT) untuk mengetahui siapa grup Induk-nya (RW)
    const requesterGroup = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
    });

    if (!requesterGroup) throw new NotFoundException('Grup komunitas tidak ditemukan');

    // Pastikan yang minta dana adalah RT (punya Parent/RW)
    if (!requesterGroup.parentId) {
      throw new ForbiddenException('Grup tingkat atas (RW) tidak dapat mengajukan dana melalui sistem ini');
    }

    // Jika pengajuan ditautkan ke acara (Event), validasi kepemilikannya
    if (dto.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Acara (Event) tidak ditemukan');
      if (event.communityGroupId !== user.communityGroupId) {
        throw new ForbiddenException('Anda tidak bisa meminta dana untuk acara milik lingkungan lain');
      }
    }

    // Eksekusi pembuatan request
    return this.prisma.fundRequest.create({
      data: {
        requesterGroupId: requesterGroup.id,
        targetGroupId: requesterGroup.parentId, // Otomatis dilempar ke RW
        amount: dto.amount,
        description: dto.description,
        eventId: dto.eventId,
        createdById: user.sub,
        status: FundRequestStatus.PENDING,
      }
    });
  }

  // ==========================================
  // 2. LIHAT DAFTAR PENGAJUAN (Berdasarkan Grup)
  // ==========================================
  async getRequestsByGroup(communityGroupId: number) {
    return this.prisma.fundRequest.findMany({
      where: {
        OR: [
          { requesterGroupId: communityGroupId }, // Sebagai RT yang mengajukan
          { targetGroupId: communityGroupId }     // Sebagai RW yang menerima pengajuan
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
  // 3. SETUJUI DANA TAMBAHAN (Oleh Bendahara RW)
  // ==========================================
  async approveExtraFunds(fundRequestId: string, user: ActiveUserData) {
    const fundReq = await this.prisma.fundRequest.findUnique({ 
      where: { id: fundRequestId } 
    });

    if (!fundReq) throw new NotFoundException('Pengajuan dana tidak ditemukan');
    if (fundReq.status !== FundRequestStatus.PENDING) {
      throw new BadRequestException('Pengajuan dana ini sudah diproses sebelumnya');
    }

    // Pastikan user berada di grup target (RW)
    if (user.communityGroupId !== fundReq.targetGroupId) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk menyetujui pengajuan ini');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update status menjadi disetujui
      const approvedRequest = await tx.fundRequest.update({
        where: { id: fundRequestId },
        data: { 
          status: FundRequestStatus.APPROVED,
          approvedById: user.sub
        }
      });

      // TODO: Panggil FinanceService di sini untuk memotong saldo RW dan menambah saldo RT
      console.log(`[Finance Trigger] Cairkan Rp${fundReq.amount} dari kas RW ke kas RT`);

      // 2. Jika ini terkait acara, catat di riwayat acara
      if (fundReq.eventId) {
        // Ambil status event saat ini agar historinya berkesinambungan
        const currentEvent = await tx.event.findUnique({ where: { id: fundReq.eventId } });
        if (currentEvent) {
          await tx.eventStatusHistory.create({
            data: {
              eventId: fundReq.eventId,
              changedById: user.sub,
              previousStatus: currentEvent.status,
              newStatus: currentEvent.status, // Status tidak berubah, hanya nambah dana
              reason: `Pengajuan dana tambahan sebesar Rp${fundReq.amount} telah disetujui oleh RW.`
            }
          });
        }
      }

      return approvedRequest;
    });
  }

  // ==========================================
  // 4. TOLAK & AMBIL KEPUTUSAN (Takeover RW)
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
      // 1. Update status menjadi ditolak
      await tx.fundRequest.update({
        where: { id: fundRequestId },
        data: { status: FundRequestStatus.REJECTED, approvedById: user.sub }
      });

      // Jika bukan pengajuan event (misal kas RT biasa), stop di sini
      if (!fundReq.eventId || !fundReq.event) {
        return { message: 'Pengajuan dana operasional ditolak oleh RW' };
      }

      // 2. Logika Pengambilalihan Keputusan (Takeover) oleh RW
      if (dto.rwDecision === RwTakeoverDecision.CANCEL_EVENT) {
        await tx.event.update({
          where: { id: fundReq.eventId },
          data: { status: EventStatus.CANCELLED }
        });

        await tx.eventStatusHistory.create({
          data: {
            eventId: fundReq.eventId,
            changedById: user.sub,
            previousStatus: fundReq.event.status,
            newStatus: EventStatus.CANCELLED,
            reason: `[DANA DITOLAK]: ${dto.reason}. RW mengambil keputusan untuk MEMBATALKAN acara.`
          }
        });

        // TODO: Panggil FinanceService untuk refund saldo ke kas (jika sudah sempat cair)
        console.log(`[Finance Trigger] Refund saldo untuk acara yang dibatalkan RW`);

        return { message: 'Dana ditolak dan Acara berhasil DIBATALKAN.' };

      } else if (dto.rwDecision === RwTakeoverDecision.CONTINUE_WITH_ORIGINAL) {
        await tx.eventStatusHistory.create({
          data: {
            eventId: fundReq.eventId,
            changedById: user.sub,
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