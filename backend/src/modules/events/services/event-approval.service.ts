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

// Threshold: Admin events with budget > 1.000.000 need Leader approval too
const LEADER_APPROVAL_THRESHOLD = 1_000_000;

@Injectable()
export class EventApprovalService {
  private readonly logger = new Logger(EventApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  // ==========================================
  // 1. GENERATE WORKFLOW (Dipanggil saat Event di-SUBMIT)
  //    - Standard: 1 step → Treasurer review
  //    - Admin event > 1jt: 2 steps → Treasurer + Leader
  // ==========================================
  async generateApprovalWorkflow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        communityGroup: true,
        createdBy: { include: { role: true } },
      },
    });

    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    const isAdminEvent = event.createdBy.role.type === SystemRoleType.ADMIN;
    const isHighBudget = Number(event.budgetEstimated) > LEADER_APPROVAL_THRESHOLD;
    const needsLeaderApproval = isAdminEvent && isHighBudget;

    // --- Step 1: Find Treasurer ---
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

    // --- Step 2 (conditional): Find Leader in parent group ---
    let leader: typeof treasurer | null = null;
    if (needsLeaderApproval) {
      if (!event.communityGroup.parentId) {
        throw new BadRequestException(
          'Acara Admin dengan anggaran > Rp1.000.000 memerlukan persetujuan Ketua RW, tetapi grup induk tidak ditemukan.',
        );
      }

      leader = await this.prisma.user.findFirst({
        where: {
          communityGroupId: event.communityGroup.parentId,
          role: { type: SystemRoleType.LEADER },
          isActive: true,
        },
        include: { role: true },
      });

      if (!leader) {
        throw new BadRequestException(
          'Ketua RW tidak ditemukan. Acara Admin dengan anggaran > Rp1.000.000 memerlukan persetujuan Ketua RW.',
        );
      }

      this.logger.debug(
        `Found leader: ${leader.fullName} (roleId=${leader.roleId}) in group ${leader.communityGroupId}`,
      );
    }

    // Hapus approval lama (idempotent, aman untuk re-submit)
    await this.prisma.eventApproval.deleteMany({
      where: { eventId: event.id },
    });

    // Buat step 1: Treasurer
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

    // Buat step 2: Leader (jika diperlukan)
    if (needsLeaderApproval && leader) {
      await this.prisma.eventApproval.create({
        data: {
          eventId: event.id,
          approverId: leader.id,
          roleSnapshot: leader.role.name,
          stepOrder: 2,
          status: ApprovalStatus.PENDING,
          notes: null,
          approvedAt: null,
        },
      });
    }

    const totalSteps = needsLeaderApproval ? 2 : 1;
    const message = needsLeaderApproval
      ? 'Persetujuan telah dikirim ke Bendahara dan Ketua RW untuk direview (2 tahap)'
      : 'Persetujuan telah dikirim ke Bendahara untuk direview';

    return { message, totalSteps };
  }

  // ==========================================
  // 2. PROCESS APPROVAL (Treasurer atau Leader)
  //    Multi-step: approve per step, FUNDED when all approved
  //    Reject → langsung REJECTED
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

    // Hanya TREASURER atau LEADER yang boleh menyetujui/menolak
    const allowedRoles: SystemRoleType[] = [SystemRoleType.TREASURER, SystemRoleType.LEADER];
    if (!allowedRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya Bendahara atau Ketua yang dapat menyetujui atau menolak acara');
    }

    // Status harus SUBMITTED
    if (event.status !== EventStatus.SUBMITTED) {
      throw new BadRequestException('Acara tidak dalam status menunggu persetujuan');
    }

    // Cari step PENDING dengan stepOrder terkecil (step yang sedang aktif)
    const pendingApproval = event.approvals.find(a => a.status === ApprovalStatus.PENDING);

    if (!pendingApproval) {
      throw new BadRequestException('Persetujuan sudah selesai diproses');
    }

    if (pendingApproval.approverId !== user.id) {
      throw new ForbiddenException('Anda bukan pihak yang ditugaskan untuk mereview acara ini pada tahap ini');
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
          `Ditolak oleh ${pendingApproval.roleSnapshot} (Tahap ${pendingApproval.stepOrder}): ${dto.notes}`
        );
        
        return { message: `Acara ditolak oleh ${pendingApproval.roleSnapshot}.` };
      } 
      
      // === APPROVED ===
      if (dto.status === ApprovalStatus.APPROVED) {
        // Cek apakah masih ada step PENDING lainnya
        const remainingPending = event.approvals.filter(
          a => a.id !== pendingApproval.id && a.status === ApprovalStatus.PENDING
        );

        if (remainingPending.length > 0) {
          // Masih ada step berikutnya → catat history, tetap SUBMITTED
          const nextApprover = remainingPending[0];
          await this.recordStatusHistory(
            tx, eventId, user.id, event.status, event.status,
            `Disetujui oleh ${pendingApproval.roleSnapshot} (Tahap ${pendingApproval.stepOrder}). Menunggu persetujuan ${nextApprover.roleSnapshot} (Tahap ${nextApprover.stepOrder}).`
          );

          return { 
            message: `Disetujui oleh ${pendingApproval.roleSnapshot}. Menunggu persetujuan tahap berikutnya.`,
            nextStep: nextApprover.stepOrder,
          };
        }

        // Semua step approved → FUNDED (auto-cairkan dana)
        await this.financeService.disburseEventFund(
          event.communityGroupId,
          Number(event.budgetEstimated),
          event.id,
        );

        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.FUNDED }
        });

        await this.recordStatusHistory(
          tx, eventId, user.id, event.status, EventStatus.FUNDED, 
          `Disetujui oleh ${pendingApproval.roleSnapshot} (Tahap ${pendingApproval.stepOrder}). Semua persetujuan lengkap. Dana Rp${Number(event.budgetEstimated).toLocaleString('id-ID')} berhasil dicairkan.`
        );

        this.logger.log(`Event ${eventId} fully approved & funded. Dana Rp${event.budgetEstimated} dicairkan.`);
        
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