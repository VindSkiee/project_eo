import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service'; // Sesuaikan path berdasarkan gambar
import { EventStatus, EventParticipantRole, Prisma } from '@prisma/client';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. CREATE EVENT (Dengan Pendaftaran Panitia)
  // ==========================================
  async createEvent(
    data: {
      title: string;
      description: string;
      budgetEstimated: number;
      startDate?: Date;
      endDate?: Date;
      communityGroupId: number;
      createdById: string;
    },
    committeeUserIds: string[] = [], // Array ID warga yang dijadikan panitia
  ) {
    // Siapkan data panitia untuk di-insert bersamaan dengan pembuatan event
    const participantsData = committeeUserIds.map((userId) => ({
      userId,
      role: EventParticipantRole.COMMITTEE,
    }));

    // Otomatis masukkan pembuat (RT/RW) sebagai panitia/komite juga jika belum ada
    if (!committeeUserIds.includes(data.createdById)) {
      participantsData.push({
        userId: data.createdById,
        role: EventParticipantRole.COMMITTEE,
      });
    }

    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        budgetEstimated: data.budgetEstimated,
        startDate: data.startDate,
        endDate: data.endDate,
        communityGroupId: data.communityGroupId,
        createdById: data.createdById,
        status: EventStatus.DRAFT, // Status awal selalu DRAFT
        participants: {
          create: participantsData, // Nested create Prisma
        },
      },
      include: {
        participants: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });
  }

  // ==========================================
  // 2. FIND ALL (Untuk Warga / Resident)
  // ==========================================
  async findAll(communityGroupId: number) {
    return this.prisma.event.findMany({
      where: {
        communityGroupId,
        // Opsi: Jika DRAFT tidak boleh dilihat warga biasa, Anda bisa filter di sini
        // status: { not: EventStatus.DRAFT },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true, role: { select: { name: true } } } },
        participants: {
          include: { user: { select: { fullName: true } } },
        },
        expenses: {
          where: { isValid: true }, // Transparansi: hanya tampilkan pengeluaran yang valid
          select: { title: true, amount: true, proofImage: true },
        },
        approvals: {
          select: { roleSnapshot: true, status: true, notes: true },
        },
      },
    });
  }

  // ==========================================
  // 3. FIND BY ID (Detail Event Lengkap)
  // ==========================================
  async findById(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        communityGroup: { select: { name: true, type: true, parentId: true } },
        createdBy: { select: { fullName: true, role: true } },
        participants: {
          include: { user: { select: { fullName: true, email: true, phone: true } } },
        },
        expenses: true, // Untuk detail, tarik semua pengeluaran (termasuk yang belum divalidasi)
        approvals: {
          include: { approver: { select: { fullName: true } } },
          orderBy: { stepOrder: 'asc' }, // Urutkan berdasarkan urutan approval
        },
        statusHistory: {
          include: { changedBy: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' }, // Jejak audit status
        },
      },
    });
  }

  // ==========================================
  // 4. UPDATE STATUS EVENT & AUDIT TRAIL
  // ==========================================
  // Menggunakan transaksi Prisma agar update status dan pencatatan histori terjadi serentak
  async updateEventStatus(
    eventId: string,
    newStatus: EventStatus,
    changedById: string,
    reason?: string,
  ) {
    const event = await this.findById(eventId);
    if (!event) throw new Error('Event tidak ditemukan');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update status utama
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: { status: newStatus },
      });

      // 2. Catat riwayat perubahan (Audit Trail)
      await tx.eventStatusHistory.create({
        data: {
          eventId,
          changedById,
          previousStatus: event.status,
          newStatus,
          reason,
        },
      });

      return updatedEvent;
    });
  }

  // ==========================================
  // 4.5 UPDATE EVENT DATA
  // ==========================================
  async updateEvent(
    eventId: string,
    data: {
      title?: string;
      description?: string;
      budgetEstimated?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  // ==========================================
  // 4.6 DELETE EVENT
  // ==========================================
  async deleteEvent(eventId: string) {
    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  // ==========================================
  // 5. ADD MORE PARTICIPANTS (Susulan)
  // ==========================================
  async addParticipants(eventId: string, userIds: string[], role: EventParticipantRole) {
    const participantsData = userIds.map((userId) => ({
      eventId,
      userId,
      role,
    }));

    // Gunakan createMany agar bisa insert banyak sekaligus dan mengabaikan yang duplikat
    return this.prisma.eventParticipant.createMany({
      data: participantsData,
      skipDuplicates: true, 
    });
  }

  // ==========================================
  // 6. CREATE EXPENSE (Upload Nota / Bon)
  // ==========================================
  async createExpense(data: {
    eventId: string;
    title: string;
    amount: number;
    proofImage?: string;
  }) {
    return this.prisma.eventExpense.create({
      data: {
        eventId: data.eventId,
        title: data.title,
        amount: data.amount,
        proofImage: data.proofImage,
        isValid: false, // Selalu false saat pertama kali diupload (menunggu Bendahara)
      },
    });
  }

  // ==========================================
  // 7. FIND EXPENSE BY ID (Helper untuk Verifikasi)
  // ==========================================
  async findExpenseById(expenseId: string) {
    return this.prisma.eventExpense.findUnique({
      where: { id: expenseId },
      include: { 
        event: { select: { communityGroupId: true, status: true } } // Di-include untuk cek IDOR di Service
      }
    });
  }

  // ==========================================
  // 8. VERIFY EXPENSE (Validasi Nota oleh Bendahara)
  // ==========================================
  async verifyExpense(expenseId: string, isValid: boolean, verifiedById: string) {
    return this.prisma.eventExpense.update({
      where: { id: expenseId },
      data: {
        isValid,
        verifiedBy: verifiedById, // Catat ID Bendahara yang memvalidasi (Audit)
      },
    });
  }

  // ==========================================
  // 9. UPDATE ACTUAL BUDGET (Saat Tutup Laporan / Settle)
  // ==========================================
  async updateActualBudget(eventId: string, budgetActual: number) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { budgetActual },
    });
  }
}