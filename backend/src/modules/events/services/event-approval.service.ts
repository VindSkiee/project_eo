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
      orderBy: { stepOrder: 'asc' }, // Urutkan: 1 (Bendahara RT) -> 2 (Ketua RT) -> 3 (RW)
      include: { role: true },
    });

    if (rules.length === 0) {
      throw new BadRequestException('Aturan persetujuan (Approval Rule) belum disetting untuk lingkungan ini');
    }

    // 2. Filter aturan berdasarkan nominal anggaran (Dynamic Threshold)
    const applicableRules = rules.filter(rule => {
      // Jika rule punya batas minimal (misal: 1.000.000), dan anggaran acara LEBIH KECIL dari batas itu,
      // maka lewati rule ini (tidak butuh approval RW).
      if (rule.minAmount && event.budgetEstimated < rule.minAmount) {
        return false; 
      }
      return true;
    });

    const approvalRecords: {
      eventId: string;
      approverId: string;
      roleSnapshot: string;
      stepOrder: number;
      status: ApprovalStatus;
    }[] = [];

    // 3. Bangun data persetujuan & Cari siapa User yang menjabat
    for (const rule of applicableRules) {
      let targetGroupId = event.communityGroupId; 
      if (rule.isCrossGroup && event.communityGroup.parentId) {
        targetGroupId = event.communityGroup.parentId;
      }

      const approver = await this.prisma.user.findFirst({
        where: { communityGroupId: targetGroupId, roleId: rule.roleId, isActive: true },
      });

      if (!approver) {
        throw new BadRequestException(`Pengurus dengan jabatan ${rule.role.name} tidak ditemukan.`);
      }

      // 👇 LOGIKA BARU: CEK APAKAH JABATAN INI DIPEGANG OLEH PEMBUAT ACARA?
      const isCreator = approver.id === event.createdById;

      approvalRecords.push({
        eventId: event.id,
        approverId: approver.id,
        roleSnapshot: rule.role.name,
        stepOrder: rule.stepOrder,
        // Jika dia yang buat acaranya, langsung set statusnya APPROVED (Otomatis)
        status: isCreator ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
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
    // (Persetujuan harus berurutan, tidak boleh lompat dari step 1 ke step 3)
    const pendingApproval = event.approvals.find(a => a.status === ApprovalStatus.PENDING);

    if (!pendingApproval) {
      throw new BadRequestException('Semua tahap persetujuan sudah selesai diproses');
    }

    // 3. Keamanan Tingkat Tinggi (Mencegah IDOR antar Pengurus)
    // Pastikan yang menekan tombol Approve BENAR-BENAR User yang ditugaskan di step ini
    if (pendingApproval.approverId !== user.sub) {
      throw new ForbiddenException(`Bukan giliran Anda. Menunggu persetujuan dari ${pendingApproval.roleSnapshot}`);
    }

    if (dto.status === ApprovalStatus.REJECTED && !dto.notes) {
      throw new BadRequestException('Alasan penolakan (notes) wajib diisi');
    }

    // 4. Eksekusi Perubahan (Menggunakan Transaksi agar Aman)
    return this.prisma.$transaction(async (tx) => {
      // a. Update status di tabel EventApproval
      await tx.eventApproval.update({
        where: { id: pendingApproval.id },
        data: { status: dto.status, notes: dto.notes },
      });

      // b. Logika penentuan status Event (Induk)
      if (dto.status === ApprovalStatus.REJECTED) {
        // Jika ada 1 saja yang REJECT, status Event langsung REJECTED
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.REJECTED }
        });

        await this.recordStatusHistory(tx, eventId, user.sub, event.status, EventStatus.REJECTED, dto.notes);
        return { message: 'Acara ditolak' };

      } else if (dto.status === ApprovalStatus.APPROVED) {
        
        // 👇 LOGIKA BARU YANG LEBIH CERDAS DAN ANTI-BUG
        // Hitung berapa total tahapan yang statusnya MASIH PENDING.
        // Karena 1 tahapan sedang diproses menjadi APPROVED saat ini, 
        // jika jumlah pendingCount adalah 1, berarti ini adalah orang terakhir!
        const pendingCount = event.approvals.filter(a => a.status === ApprovalStatus.PENDING).length;
        const isLastStep = pendingCount === 1;

        if (isLastStep) {
          // 🎉 SELURUH RANTAI SELESAI (Tidak ada lagi yang PENDING)
          await tx.event.update({
            where: { id: eventId },
            data: { status: EventStatus.APPROVED }
          });
          await this.recordStatusHistory(tx, eventId, user.sub, event.status, EventStatus.APPROVED, 'Telah disetujui sepenuhnya');
          
          return { message: 'Acara disetujui sepenuhnya! Menunggu pencairan dana.' };
        } else {
          // Masih ada tahap PENDING lainnya
          if (event.status === EventStatus.SUBMITTED) {
            await tx.event.update({
              where: { id: eventId },
              data: { status: EventStatus.UNDER_REVIEW }
            });
            await this.recordStatusHistory(tx, eventId, user.sub, event.status, EventStatus.UNDER_REVIEW, 'Disetujui sebagian');
          }
          return { message: `Persetujuan berhasil. Menunggu pengurus lain.` };
        }
      }
    });
  }

  // ==========================================
  // FUNGSI PEMBANTU: AUDIT TRAIL DALAM TRANSAKSI
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