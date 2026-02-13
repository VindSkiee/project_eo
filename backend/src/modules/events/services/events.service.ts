import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { EventsRepository } from '../events.repository';
import { ActiveUserData } from '@common/decorators/active-user.decorator'; // Sesuaikan path
import { EventStatus, SystemRoleType } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventApprovalService } from './event-approval.service';
import { SubmitExpenseDto } from '../dto/submit-expense.dto';
import { VerifyExpenseDto } from '../dto/verify-expense.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly eventApprovalService: EventApprovalService
  ) { }

  // ==========================================
  // FUNGSI PEMBANTU: PENCEGAHAN IDOR LINTAS RT
  // ==========================================
  private checkGroupAccess(eventCommunityGroupId: number, user: ActiveUserData) {
    // Memastikan warga RT 01 tidak bisa melihat/mengedit event milik RT 02
    // Catatan: Jika user adalah RW (Parent Group), logikanya bisa diperluas di sini nanti
    if (eventCommunityGroupId !== user.communityGroupId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data acara di lingkungan ini');
    }
  }

  // ==========================================
  // 1. CREATE EVENT
  // ==========================================
  async createEvent(
    createEventDto: CreateEventDto,
    user: ActiveUserData,
    committeeUserIds: string[] = []
  ) {
    // Hanya pengurus yang boleh membuat acara resmi menggunakan kas
    // 👇 PERBAIKAN 1: Deklarasi tipe array secara eksplisit
    const pengurusRoles: SystemRoleType[] = [
      SystemRoleType.ADMIN,
      SystemRoleType.TREASURER,
      SystemRoleType.LEADER
    ];
    const isPengurus = pengurusRoles.includes(user.roleType);
    if (!isPengurus) {
      throw new ForbiddenException('Hanya pengurus RT/RW yang dapat membuat pengajuan acara');
    }

    return this.eventsRepo.createEvent(
      {
        ...createEventDto,
        communityGroupId: user.communityGroupId, // Paksa gunakan ID grup dari token JWT (Aman)
        createdById: user.sub,
      },
      committeeUserIds,
    );
  }

  // ==========================================
  // 2. GET ALL EVENTS (Transparansi Warga)
  // ==========================================
  async findAllEvents(user: ActiveUserData) {
    // Warga hanya akan melihat acara di RT/RW-nya sendiri
    const events = await this.eventsRepo.findAll(user.communityGroupId);

    // Filter tambahan: Warga biasa tidak perlu melihat acara yang masih DRAFT
    if (user.roleType === SystemRoleType.RESIDENT) {
      return events.filter(event => event.status !== EventStatus.DRAFT);
    }

    return events;
  }

  // ==========================================
  // 3. GET EVENT DETAILS
  // ==========================================
  async getEventDetails(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    // Cegah IDOR
    this.checkGroupAccess(event.communityGroupId, user);

    return event;
  }

  // ==========================================
  // 4. UPDATE EVENT (Hanya saat DRAFT)
  // ==========================================
  async updateEvent(eventId: string, updateEventDto: UpdateEventDto, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    this.checkGroupAccess(event.communityGroupId, user);

    // Hanya pembuat acara yang bisa mengedit
    if (event.createdById !== user.sub) {
      throw new ForbiddenException('Hanya pembuat acara yang dapat mengubah detailnya');
    }

    // Mencegah perubahan data jika sudah diajukan ke Bendahara/RW
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Acara yang sudah diajukan (SUBMITTED) tidak dapat diubah. Silakan batalkan terlebih dahulu.');
    }

    // Di dalam events.service.ts
    await this.eventApprovalService.generateApprovalWorkflow(eventId);
  }

  // ==========================================
  // 5. SUBMIT EVENT (Draft -> Submitted)
  // ==========================================
  async submitEvent(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    this.checkGroupAccess(event.communityGroupId, user);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Hanya acara berstatus DRAFT yang dapat diajukan');
    }

    // Ubah status ke SUBMITTED
    const updatedEvent = await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SUBMITTED,
      user.sub,
      'Pengajuan awal oleh pembuat acara'
    );

    // TODO: Panggil EventApprovalService di sini untuk meng-generate struktur approval berjenjang
    // berdasarkan event.budgetEstimated (Apakah butuh RW atau cukup RT).

    return updatedEvent;
  }

  // ==========================================
  // 6. CANCEL EVENT & REFUND WALLET LOGIC
  // ==========================================
  async cancelEvent(eventId: string, reason: string, user: ActiveUserData) {
    const event = await this.getEventDetails(eventId, user); // Sudah melewati pengecekan NotFound & IDOR

    // 👇 PERBAIKAN 2: Deklarasi tipe array EventStatus eksplisit
    const nonCancelableStatuses: EventStatus[] = [
      EventStatus.COMPLETED,
      EventStatus.SETTLED,
      EventStatus.CANCELLED
    ];

    if (nonCancelableStatuses.includes(event.status)) {
      throw new BadRequestException(`Acara berstatus ${event.status} tidak dapat dibatalkan`);
    }

    // 👇 PERBAIKAN 3: Deklarasi tipe array SystemRoleType eksplisit
    const topLevelAdmins: SystemRoleType[] = [
      SystemRoleType.ADMIN,
      SystemRoleType.LEADER
    ];

    // Hak akses batal: Hanya pembuat acara atau Leader/Admin
    const isCreator = event.createdById === user.sub;
    const isTopLevelAdmin = topLevelAdmins.includes(user.roleType);
    if (!isCreator && !isTopLevelAdmin) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk membatalkan acara ini');
    }

    // CATATAN PENTING: Jika status acara sudah FUNDED (Uang sudah cair ke panitia)
    // Maka harus ada logika pengembalian (Refund) 100% uang ke tabel Wallet
    if (event.status === EventStatus.FUNDED || event.status === EventStatus.ONGOING) {
      // TODO: Panggil FinanceService di sini untuk membuat Transaction tipe CREDIT
      // sebesar `event.budgetActual` atau `event.budgetEstimated` kembali ke Kas RT.
      // this.financeService.refundEventFunds(eventId, event.communityGroupId, event.budgetEstimated);

      console.log(`[Finance Trigger] Refund dana event ${eventId} sebesar ${event.budgetEstimated} dikembalikan ke kas`);
    }

    // Eksekusi pembatalan dan catat riwayatnya
    return this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.CANCELLED,
      user.sub,
      `Dibatalkan: ${reason}`
    );
  }

  // ==========================================
  // 7. SUBMIT EXPENSE (Panitia Upload Nota)
  // ==========================================
  async submitEventExpense(
    eventId: string,
    dto: SubmitExpenseDto, // { title: string, amount: number, proofImage?: string }
    user: ActiveUserData
  ) {
    const event = await this.getEventDetails(eventId, user); // Sudah termasuk cek IDOR

    // Validasi Status: Nota hanya bisa diupload jika acara sedang berjalan atau uang sudah cair
    const allowedStatuses: EventStatus[] = [EventStatus.FUNDED, EventStatus.ONGOING];
    if (!allowedStatuses.includes(event.status)) {
      throw new BadRequestException('Nota hanya dapat diunggah saat acara berstatus FUNDED atau ONGOING');
    }

    // Validasi Akses: Hanya Pembuat Acara atau Panitia (COMMITTEE) yang boleh upload
    const isCreator = event.createdById === user.sub;
    const isCommittee = event.participants.some(
      (p) => p.userId === user.sub && p.role === 'COMMITTEE'
    );

    if (!isCreator && !isCommittee) {
      throw new ForbiddenException('Hanya panitia acara yang diizinkan mengunggah bukti pengeluaran');
    }

    // Ubah status acara dari FUNDED menjadi ONGOING secara otomatis saat nota pertama masuk
    if (event.status === EventStatus.FUNDED) {
      await this.eventsRepo.updateEventStatus(
        eventId,
        EventStatus.ONGOING,
        user.sub,
        'Nota pertama diunggah, acara otomatis menjadi ONGOING'
      );
    }

    // Simpan nota ke database (Status isValid otomatis false dari Repository)
    return this.eventsRepo.createExpense({
      eventId,
      title: dto.title,
      amount: dto.amount,
      proofImage: dto.proofImage,
    });
  }

  // ==========================================
  // 8. VERIFY EXPENSE (Bendahara Cek & Sahkan Nota)
  // ==========================================
  async verifyExpense(
    expenseId: string,
    dto: VerifyExpenseDto, // { isValid: boolean }
    user: ActiveUserData
  ) {
    // 1. Cari nota dan validasi kepemilikan acara (Cegah IDOR antar Bendahara)
    const expense = await this.eventsRepo.findExpenseById(expenseId);
    if (!expense) throw new NotFoundException('Data pengeluaran tidak ditemukan');

    this.checkGroupAccess(expense.event.communityGroupId, user);

    // 2. Hanya ADMIN (dan mungkin Ketua) yang berhak memvalidasi
    const verifierRoles: SystemRoleType[] = [SystemRoleType.ADMIN, SystemRoleType.LEADER];
    if (!verifierRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya Bendahara atau Ketua yang dapat memvalidasi nota pengeluaran');
    }

    // 3. Eksekusi verifikasi
    return this.eventsRepo.verifyExpense(expenseId, dto.isValid, user.sub);
  }

  // ==========================================
  // 9. SETTLE EVENT (Tutup Laporan & Hitung Kembalian)
  // ==========================================
  async settleEvent(eventId: string, user: ActiveUserData) {
    // Ambil data event beserta seluruh relasi pengeluarannya (expenses)
    const event = await this.getEventDetails(eventId, user);

    const settleableStatuses: EventStatus[] = [EventStatus.ONGOING, EventStatus.COMPLETED];
    if (!settleableStatuses.includes(event.status)) {
      throw new BadRequestException('Hanya acara yang sedang berjalan atau selesai yang dapat ditutup laporannya');
    }

    // Hak akses tutup buku: Bendahara, Ketua, atau Pembuat Acara
    const isCreator = event.createdById === user.sub;
    const canSettleRoles: SystemRoleType[] = [SystemRoleType.LEADER, SystemRoleType.ADMIN];
    if (!isCreator && !canSettleRoles.includes(user.roleType)) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk menutup laporan acara ini');
    }

    // ==========================================
    // LOGIKA KALKULASI KEUANGAN (THE MAGIC)
    // ==========================================

    // 1. Hitung total uang yang BENAR-BENAR TERPAKAI (Hanya dari nota yang sudah di-verify Bendahara)
    const totalSpent = event.expenses
      .filter(expense => expense.isValid === true)
      .reduce((sum, expense) => sum + Number(expense.amount), 0); // Convert Decimal Prisma ke Number

    // 2. Hitung total uang sisa (Dana Awal - Dana Terpakai)
    // Catatan: Jika ada pengajuan dana tambahan (FundRequest), tambahkan juga logikanya di sini besok.
    const totalFunded = Number(event.budgetEstimated);
    const refundAmount = totalFunded - totalSpent;

    if (refundAmount < 0) {
      throw new BadRequestException(`Minus! Pengeluaran (Rp${totalSpent}) melebihi anggaran yang dicairkan (Rp${totalFunded}). Harap ajukan dana tambahan (Fund Request) terlebih dahulu.`);
    }

    // 3. Eksekusi Penutupan Laporan
    // A. Update Budget Actual di database
    await this.eventsRepo.updateActualBudget(eventId, totalSpent);

    // B. Ubah Status Acara menjadi SETTLED (Selesai Sepenuhnya)
    const settledEvent = await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SETTLED,
      user.sub,
      `Laporan ditutup. Total terpakai: Rp${totalSpent}. Sisa dana: Rp${refundAmount}`
    );

    // C. Trigger Modul Finance untuk Mutasi Sisa Uang
    if (refundAmount > 0) {
      // TODO: Panggil FinanceService di sini besok
      // this.financeService.refundToWallet(event.communityGroupId, refundAmount, eventId);
      console.log(`[Finance Trigger] Acara Selesai! Mengembalikan sisa dana Rp${refundAmount} ke Wallet Grup ${event.communityGroupId}`);
    }

    return {
      message: 'Laporan acara berhasil ditutup',
      budgetEstimated: totalFunded,
      budgetActual: totalSpent,
      refundedAmount: refundAmount,
      event: settledEvent
    };
  }
}