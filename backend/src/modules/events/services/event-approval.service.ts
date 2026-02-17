import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service'; // Sesuaikan path
import { EventStatus, ApprovalStatus } from '@prisma/client';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { ProcessApprovalDto } from '../dto/process-approval.dto';

@Injectable()
export class EventApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. GENERATE WORKFLOW (Dipanggil saat Event di-SUBMIT)
  // ==========================================
  async generateApprovalWorkflow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { communityGroup: true },
    });

    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    // 1. Tarik semua aturan approval untuk RT tersebut
    const rules = await this.prisma.approvalRule.findMany({
      where: { communityGroupId: event.communityGroupId },
      orderBy: { stepOrder: 'asc' }, 
      include: { role: true },
    });

    if (rules.length === 0) {
      throw new BadRequestException('Aturan persetujuan (Approval Rule) belum disetting untuk lingkungan ini');
    }

    // 2. Filter aturan berdasarkan nominal anggaran (Dynamic Threshold)
    const applicableRules = rules.filter(rule => {
      // Jika rule punya batas minimal, dan anggaran acara kurang dari batas itu, skip.
      if (rule.minAmount && Number(event.budgetEstimated) < Number(rule.minAmount)) {
        return false; 
      }
      return true;
    });

    const approvalRecords: Array<{
      eventId: string;
      approverId: string;
      roleSnapshot: string;
      stepOrder: number;
      status: ApprovalStatus;
      notes: string | null;
      approvedAt: Date | null;
    }> = [];

    // 3. Bangun data persetujuan & Cari siapa User yang menjabat
    for (const rule of applicableRules) {
      let targetGroupId = event.communityGroupId; 
      // Jika aturan lintas grup (misal butuh RW), arahkan ke Parent
      if (rule.isCrossGroup && event.communityGroup.parentId) {
        targetGroupId = event.communityGroup.parentId;
      }

      const approver = await this.prisma.user.findFirst({
        where: { communityGroupId: targetGroupId, roleId: rule.roleId, isActive: true },
      });

      if (!approver) {
        throw new BadRequestException(`Pengurus dengan jabatan ${rule.role.name} tidak ditemukan.`);
      }

      // Cek: Apakah pejabat ini adalah si pembuat acara sendiri?
      const isCreator = approver.id === event.createdById;

      approvalRecords.push({
        eventId: event.id,
        approverId: approver.id,
        roleSnapshot: rule.role.name,
        stepOrder: rule.stepOrder,
        // Auto-approve jika yang menjabat adalah pembuat acara
        status: isCreator ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
        // Jika auto-approve, beri catatan otomatis
        notes: isCreator ? 'Auto-approved (Creator is Approver)' : null,
        approvedAt: isCreator ? new Date() : null,
      });
    }

    // 4. Simpan semua langkah ke database
    await this.prisma.eventApproval.createMany({
      data: approvalRecords,
    });

    return { 
      message: 'Alur persetujuan berhasil dibuat', 
      totalSteps: approvalRecords.length 
    };
  }

  // ==========================================
  // 2. PROCESS APPROVAL (Ditekan oleh RT/RW)
  // ==========================================
  async processApproval(eventId: string, user: ActiveUserData, dto: ProcessApprovalDto) {
    // 1. Ambil data event beserta seluruh jejak approvalnya
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { approvals: { orderBy: { stepOrder: 'asc' } } }
    });

    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    // Hanya bisa memproses jika status acara sedang diajukan
    const validStatuses: EventStatus[] = [EventStatus.SUBMITTED, EventStatus.UNDER_REVIEW];
    if (!validStatuses.includes(event.status)) {
      throw new BadRequestException('Acara tidak dalam status menunggu persetujuan');
    }

    // 2. Cari TAHAP MANA yang sedang menunggu persetujuan
    // Ambil item pertama yang statusnya masih PENDING
    const pendingApproval = event.approvals.find(a => a.status === ApprovalStatus.PENDING);

    if (!pendingApproval) {
      throw new BadRequestException('Semua tahap persetujuan sudah selesai diproses');
    }

    // 3. Keamanan Tingkat Tinggi (Mencegah IDOR antar Pengurus)
    if (pendingApproval.approverId !== user.id) {
      throw new ForbiddenException(`Bukan giliran Anda. Menunggu persetujuan dari ${pendingApproval.roleSnapshot}`);
    }

    // Validasi Notes jika Reject
    if (dto.status === ApprovalStatus.REJECTED && !dto.notes) {
      throw new BadRequestException('Alasan penolakan (notes) wajib diisi');
    }

    // 4. Eksekusi Perubahan (Atomic Transaction)
    return this.prisma.$transaction(async (tx) => {
      // a. Update status di tabel EventApproval (Tanda tangan digital user)
      await tx.eventApproval.update({
        where: { id: pendingApproval.id },
        data: { 
            status: dto.status, 
            notes: dto.notes,
            approvedAt: new Date() // Catat waktu persetujuan
        },
      });

      // b. Logika REJECT (Gagal Total)
      if (dto.status === ApprovalStatus.REJECTED) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.REJECTED }
        });

        await this.recordStatusHistory(
            tx, eventId, user.id, event.status, EventStatus.REJECTED, 
            `Ditolak oleh ${pendingApproval.roleSnapshot}: ${dto.notes}`
        );
        
        return { message: 'Acara ditolak.' };
      } 
      
      // c. Logika APPROVE (Cek Kelanjutan)
      else if (dto.status === ApprovalStatus.APPROVED) {
        
        // Cek apakah ada step approval lain yang urutannya (stepOrder) LEBIH BESAR dari step ini?
        const nextStep = event.approvals.find(a => a.stepOrder > pendingApproval.stepOrder);

        if (!nextStep) {
          // 🎉 TIDAK ADA step selanjutnya -> Berarti ini FINAL STEP!
          
          await tx.event.update({
            where: { id: eventId },
            data: { status: EventStatus.APPROVED } // Ubah jadi APPROVED (Siap dicairkan)
          });
          
          await this.recordStatusHistory(
              tx, eventId, user.id, event.status, EventStatus.APPROVED, 
              'Telah disetujui sepenuhnya. Menunggu pencairan dana oleh Bendahara.'
          );
          
          return { message: 'Acara disetujui sepenuhnya! Menunggu pencairan dana.' };

        } else {
          // ⏳ MASIH ADA step selanjutnya -> Status tetap UNDER_REVIEW
          
          // Pastikan status event berubah jadi UNDER_REVIEW (jika sebelumnya masih SUBMITTED)
          if (event.status !== EventStatus.UNDER_REVIEW) {
            await tx.event.update({
              where: { id: eventId },
              data: { status: EventStatus.UNDER_REVIEW }
            });
            
            await this.recordStatusHistory(
                tx, eventId, user.id, event.status, EventStatus.UNDER_REVIEW, 
                `Disetujui oleh ${pendingApproval.roleSnapshot}, lanjut ke tahap berikutnya.`
            );
          } else {
             // 📝 LOGGING PROGRES (Audit Trail)
             // Status event tidak berubah (tetap UNDER_REVIEW), tapi kita perlu mencatat
             // bahwa satu tahap approval sudah selesai.
             await this.recordStatusHistory(
                tx, 
                eventId, 
                user.id, 
                EventStatus.UNDER_REVIEW, // Status Awal
                EventStatus.UNDER_REVIEW, // Status Akhir (Tetap sama)
                `Disetujui oleh ${pendingApproval.roleSnapshot} (Tahap ${pendingApproval.stepOrder}). Melanjutkan ke pejabat berikutnya.`
             );
          }

          return { message: `Persetujuan berhasil. Menunggu pengurus tahap berikutnya.` };
        }
      }
    });
  }

  // ==========================================
  // FUNGSI PEMBANTU: AUDIT TRAIL
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