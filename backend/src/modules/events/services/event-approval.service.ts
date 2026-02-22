import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EventStatus, ApprovalStatus, SystemRoleType } from '@prisma/client';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { ProcessApprovalDto } from '../dto/process-approval.dto';
import { FinanceService } from '../../finance/services/finance.service';

@Injectable()
export class EventApprovalService {
  private readonly logger = new Logger(EventApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  // ==========================================
  // 1. GENERATE WORKFLOW (Dipanggil saat Event di-SUBMIT)
  //    Simplified: hanya 1 step → Treasurer review
  // ==========================================
  async generateApprovalWorkflow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { communityGroup: true },
    });

    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    // Cari Treasurer di group ini
    let treasurer = await this.prisma.user.findFirst({
      where: { 
        communityGroupId: event.communityGroupId, 
        role: { type: SystemRoleType.TREASURER },
        isActive: true,
      },
      include: { role: true },
    });

    // Fallback: cari di parent group 
    if (!treasurer && event.communityGroup.parentId) {
      this.logger.warn(
        `Treasurer tidak ditemukan di group ${event.communityGroupId}, mencoba parent group ${event.communityGroup.parentId}`,
      );
      treasurer = await this.prisma.user.findFirst({
        where: { 
          communityGroupId: event.communityGroup.parentId, 
          role: { type: SystemRoleType.TREASURER },
          isActive: true,
        },
        include: { role: true },
      });
    }

    if (!treasurer) {
      throw new BadRequestException(
        'Bendahara tidak ditemukan di lingkungan ini maupun di induknya. Pastikan ada user dengan jabatan Bendahara.',
      );
    }

    this.logger.debug(
      `Found treasurer: ${treasurer.fullName} (roleId=${treasurer.roleId}) in group ${treasurer.communityGroupId}`,
    );

    // Hapus approval lama (idempotent, aman untuk re-submit)
    await this.prisma.eventApproval.deleteMany({
      where: { eventId: event.id },
    });

    // Buat 1 step approval untuk Treasurer
    await this.prisma.eventApproval.create({
      data: {
        eventId: event.id,
        approverId: treasurer.id,
        roleSnapshot: treasurer.role.name,
        stepOrder: 1,
        status: ApprovalStatus.PENDING,
        notes: null,
        approvedAt: null,
      },
    });

    return { 
      message: 'Persetujuan telah dikirim ke Bendahara untuk direview', 
      totalSteps: 1 
    };
  }

  // ==========================================
  // 2. PROCESS APPROVAL (Hanya Treasurer)
  //    Approve → langsung FUNDED (auto-cairkan dana)
  //    Reject  → REJECTED
  // ==========================================
  async processApproval(eventId: string, user: ActiveUserData, dto: ProcessApprovalDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        approvals: { orderBy: { stepOrder: 'asc' } },
        communityGroup: true,
      }
    });

    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    // Hanya TREASURER yang boleh menyetujui/menolak
    if (user.roleType !== SystemRoleType.TREASURER) {
      throw new ForbiddenException('Hanya Bendahara yang dapat menyetujui atau menolak acara');
    }

    // Status harus SUBMITTED
    if (event.status !== EventStatus.SUBMITTED) {
      throw new BadRequestException('Acara tidak dalam status menunggu persetujuan');
    }

    const pendingApproval = event.approvals.find(a => a.status === ApprovalStatus.PENDING);

    if (!pendingApproval) {
      throw new BadRequestException('Persetujuan sudah selesai diproses');
    }

    if (pendingApproval.approverId !== user.id) {
      throw new ForbiddenException('Anda bukan Bendahara yang ditugaskan untuk mereview acara ini');
    }

    // Validasi Notes jika Reject
    if (dto.status === ApprovalStatus.REJECTED && !dto.notes) {
      throw new BadRequestException('Alasan penolakan wajib diisi');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update EventApproval record
      await tx.eventApproval.update({
        where: { id: pendingApproval.id },
        data: { 
          status: dto.status, 
          notes: dto.notes,
          approvedAt: new Date(),
        },
      });

      // === REJECTED ===
      if (dto.status === ApprovalStatus.REJECTED) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.REJECTED }
        });

        await this.recordStatusHistory(
          tx, eventId, user.id, event.status, EventStatus.REJECTED, 
          `Ditolak oleh Bendahara: ${dto.notes}`
        );
        
        return { message: 'Acara ditolak oleh Bendahara.' };
      } 
      
      // === APPROVED → langsung FUNDED ===
      if (dto.status === ApprovalStatus.APPROVED) {
        // 1. Cairkan dana dari wallet
        await this.financeService.disburseEventFund(
          event.communityGroupId,
          Number(event.budgetEstimated),
          event.id,
        );

        // 2. Update status langsung ke FUNDED
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.FUNDED }
        });

        await this.recordStatusHistory(
          tx, eventId, user.id, event.status, EventStatus.FUNDED, 
          `Disetujui oleh Bendahara. Dana Rp${Number(event.budgetEstimated).toLocaleString('id-ID')} berhasil dicairkan.`
        );

        this.logger.log(`Event ${eventId} approved & funded. Dana Rp${event.budgetEstimated} dicairkan.`);
        
        return { 
          message: `Acara disetujui! Dana sebesar Rp${Number(event.budgetEstimated).toLocaleString('id-ID')} berhasil dicairkan.` 
        };
      }
    });
  }

  // ==========================================
  // HELPER: AUDIT TRAIL
  // ==========================================
  private async recordStatusHistory(
    tx: any, 
    eventId: string, 
    changedById: string, 
    previousStatus: EventStatus, 
    newStatus: EventStatus, 
    reason?: string
  ) {
    await tx.eventStatusHistory.create({
      data: { eventId, changedById, previousStatus, newStatus, reason }
    });
  }
}