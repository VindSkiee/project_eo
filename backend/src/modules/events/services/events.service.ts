import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { EventsRepository } from '../events.repository';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { EventStatus, SystemRoleType } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventApprovalService } from './event-approval.service';
import { SubmitExpenseDto } from '../dto/submit-expense.dto';
import { VerifyExpenseDto } from '../dto/verify-expense.dto';
// 👇 IMPORT FINANCE SERVICE
import { FinanceService } from '../../finance/services/finance.service'; 

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly eventApprovalService: EventApprovalService,
    private readonly financeService: FinanceService // 👈 INJECT DI SINI
  ) { }

  // ==========================================
  // FUNGSI PEMBANTU: PENCEGAHAN IDOR LINTAS RT
  // ==========================================
  private checkGroupAccess(eventCommunityGroupId: number, user: ActiveUserData) {
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
        communityGroupId: user.communityGroupId,
        createdById: user.id,
      },
      committeeUserIds,
    );
  }

  // ==========================================
  // 2. GET ALL EVENTS
  // ==========================================
  async findAllEvents(user: ActiveUserData) {
    const events = await this.eventsRepo.findAll(user.communityGroupId);

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

    if (event.createdById !== user.id) {
      throw new ForbiddenException('Hanya pembuat acara yang dapat mengubah detailnya');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Acara yang sudah diajukan (SUBMITTED) tidak dapat diubah.');
    }

    return this.eventsRepo.updateEvent(eventId, updateEventDto);
  }

  // ==========================================
  // 4.5 DELETE EVENT (Hanya saat DRAFT)
  // ==========================================
  async deleteEvent(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');

    this.checkGroupAccess(event.communityGroupId, user);

    if (event.createdById !== user.id) {
      throw new ForbiddenException('Hanya pembuat acara yang dapat menghapusnya');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Acara yang sudah diajukan (SUBMITTED) tidak dapat dihapus.');
    }

    await this.eventsRepo.deleteEvent(eventId);
    return { message: 'Acara berhasil dihapus' };
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

    const updatedEvent = await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SUBMITTED,
      user.id,
      'Pengajuan awal oleh pembuat acara'
    );

    // Generate workflow approval
    await this.eventApprovalService.generateApprovalWorkflow(eventId);

    return updatedEvent;
  }

  // ==========================================
  // [BARU] 5.5 FUND EVENT (Approved -> Funded)
  // ==========================================
  // Method ini untuk mencairkan dana saat status sudah APPROVED
  async fundEvent(eventId: string, user: ActiveUserData) {
    const event = await this.getEventDetails(eventId, user);

    // 1. Validasi Status
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('Hanya acara yang sudah DISETUJUI (APPROVED) yang dananya bisa dicairkan.');
    }

    // 2. Validasi Role (Hanya Bendahara/Ketua yang boleh pegang tombol cairkan uang)
    const allowedRoles: SystemRoleType[] = [SystemRoleType.TREASURER, SystemRoleType.LEADER];
    if (!allowedRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya Bendahara atau Ketua yang dapat mencairkan dana acara.');
    }

    // 3. INTEGRASI FINANCE: Kurangi Saldo Wallet (Disbursement)
    // Jika saldo kurang, fungsi ini akan throw Error dan proses berhenti di sini.
    await this.financeService.disburseEventFund(
        event.communityGroupId, 
        Number(event.budgetEstimated), // Convert Decimal ke Number
        event.id
    );

    // 4. Update Status Acara ke FUNDED
    return this.eventsRepo.updateEventStatus(
        eventId, 
        EventStatus.FUNDED, 
        user.id, 
        `Dana sebesar Rp${event.budgetEstimated} berhasil dicairkan.`
    );
  }

  // ==========================================
  // 6. CANCEL EVENT & REFUND WALLET LOGIC
  // ==========================================
  async cancelEvent(eventId: string, reason: string, user: ActiveUserData) {
    const event = await this.getEventDetails(eventId, user);

    const nonCancelableStatuses: EventStatus[] = [
      EventStatus.COMPLETED,
      EventStatus.SETTLED,
      EventStatus.CANCELLED
    ];

    if (nonCancelableStatuses.includes(event.status)) {
      throw new BadRequestException(`Acara berstatus ${event.status} tidak dapat dibatalkan`);
    }

    const topLevelAdmins: SystemRoleType[] = [
      SystemRoleType.ADMIN,
      SystemRoleType.LEADER
    ];

    const isCreator = event.createdById === user.id;
    const isTopLevelAdmin = topLevelAdmins.includes(user.roleType);
    if (!isCreator && !isTopLevelAdmin) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk membatalkan acara ini');
    }

    // 👇 INTEGRASI FINANCE: REFUND FULL
    if (event.status === EventStatus.FUNDED || event.status === EventStatus.ONGOING) {
       // Panggil FinanceService untuk mengembalikan 100% modal awal
       await this.financeService.refundEventFund(
          event.communityGroupId,
          Number(event.budgetEstimated), // Refund sebesar budget awal
          event.id,
          `Full Refund akibat Pembatalan Acara: ${reason}`
       );
       console.log(`[Finance Trigger] Refund Full dana event ${eventId} berhasil.`);
    }

    return this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.CANCELLED,
      user.id,
      `Dibatalkan: ${reason}`
    );
  }

  // ==========================================
  // 7. SUBMIT EXPENSE (Panitia Upload Nota)
  // ==========================================
  async submitEventExpense(
    eventId: string,
    dto: SubmitExpenseDto,
    user: ActiveUserData
  ) {
    const event = await this.getEventDetails(eventId, user);

    const allowedStatuses: EventStatus[] = [EventStatus.FUNDED, EventStatus.ONGOING];
    if (!allowedStatuses.includes(event.status)) {
      throw new BadRequestException('Nota hanya dapat diunggah saat acara berstatus FUNDED atau ONGOING');
    }

    const isCreator = event.createdById === user.id;
    const isCommittee = event.participants.some(
      (p) => p.userId === user.id && p.role === 'COMMITTEE'
    );

    if (!isCreator && !isCommittee) {
      throw new ForbiddenException('Hanya panitia acara yang diizinkan mengunggah bukti pengeluaran');
    }

    if (event.status === EventStatus.FUNDED) {
      await this.eventsRepo.updateEventStatus(
        eventId,
        EventStatus.ONGOING,
        user.id,
        'Nota pertama diunggah, acara otomatis menjadi ONGOING'
      );
    }

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
    dto: VerifyExpenseDto,
    user: ActiveUserData
  ) {
    const expense = await this.eventsRepo.findExpenseById(expenseId);
    if (!expense) throw new NotFoundException('Data pengeluaran tidak ditemukan');

    this.checkGroupAccess(expense.event.communityGroupId, user);

    const verifierRoles: SystemRoleType[] = [SystemRoleType.ADMIN, SystemRoleType.LEADER, SystemRoleType.TREASURER];
    if (!verifierRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya Bendahara atau Ketua yang dapat memvalidasi nota pengeluaran');
    }

    return this.eventsRepo.verifyExpense(expenseId, dto.isValid, user.id);
  }

  // ==========================================
  // 9. SETTLE EVENT (Tutup Laporan & Hitung Kembalian)
  // ==========================================
  async settleEvent(eventId: string, user: ActiveUserData) {
    const event = await this.getEventDetails(eventId, user);

    const settleableStatuses: EventStatus[] = [EventStatus.ONGOING, EventStatus.COMPLETED];
    if (!settleableStatuses.includes(event.status)) {
      throw new BadRequestException('Hanya acara yang sedang berjalan atau selesai yang dapat ditutup laporannya');
    }

    const isCreator = event.createdById === user.id;
    const canSettleRoles: SystemRoleType[] = [SystemRoleType.LEADER, SystemRoleType.ADMIN, SystemRoleType.TREASURER];
    if (!isCreator && !canSettleRoles.includes(user.roleType)) {
      throw new ForbiddenException('Anda tidak memiliki hak untuk menutup laporan acara ini');
    }

    // 1. Hitung total uang yang BENAR-BENAR TERPAKAI (Valid Only)
    const totalSpent = event.expenses
      .filter(expense => expense.isValid === true)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    // 2. Hitung total uang sisa
    const totalFunded = Number(event.budgetEstimated);
    const refundAmount = totalFunded - totalSpent;

    if (refundAmount < 0) {
      throw new BadRequestException(`Minus! Pengeluaran (Rp${totalSpent}) melebihi anggaran yang dicairkan (Rp${totalFunded}). Harap ajukan dana tambahan (Fund Request) terlebih dahulu.`);
    }

    // 3. Eksekusi Penutupan Laporan
    await this.eventsRepo.updateActualBudget(eventId, totalSpent);

    const settledEvent = await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SETTLED,
      user.id,
      `Laporan ditutup. Total terpakai: Rp${totalSpent}. Sisa dana: Rp${refundAmount}`
    );

    // 👇 INTEGRASI FINANCE: PARTIAL REFUND (SISA UANG)
    if (refundAmount > 0) {
      await this.financeService.refundEventFund(
        event.communityGroupId, 
        refundAmount, 
        event.id,
        'Pengembalian sisa anggaran acara (Settlement)'
      );
      console.log(`[Finance Trigger] Sisa dana Rp${refundAmount} berhasil dikembalikan ke Wallet.`);
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