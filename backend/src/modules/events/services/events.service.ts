import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventsRepository } from '../events.repository';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { EventStatus, SystemRoleType } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventApprovalService } from './event-approval.service';
import { SubmitExpenseReportDto } from '../dto/submit-expense-report.dto';
import { ExtendEventDateDto } from '../dto/extend-event-date.dto';
import { FinanceService } from '../../finance/services/finance.service'; 
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../../providers/storage/storage.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly eventApprovalService: EventApprovalService,
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  private async checkGroupAccess(eventCommunityGroupId: number, user: ActiveUserData) {
    if (eventCommunityGroupId === user.communityGroupId) return;

    const userGroup = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
      select: { parentId: true },
    });

    if (userGroup?.parentId && eventCommunityGroupId === userGroup.parentId) return;

    throw new ForbiddenException('Anda tidak memiliki akses ke data acara di lingkungan ini');
  }

  // ==========================================
  // 1. CREATE EVENT (Leader/Admin only)
  // ==========================================
  async createEvent(
    createEventDto: CreateEventDto,
    user: ActiveUserData,
    committeeUserIds: string[] = []
  ) {
    const pengurusRoles: SystemRoleType[] = [
      SystemRoleType.ADMIN,
      SystemRoleType.LEADER
    ];
    const isPengurus = pengurusRoles.includes(user.roleType);
    if (!isPengurus) {
      throw new ForbiddenException('Hanya Ketua atau Admin yang dapat membuat pengajuan acara');
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
  // 2. GET ALL EVENTS + Auto-Complete Check
  // ==========================================
  async findAllEvents(user: ActiveUserData) {
    const groupIds = [user.communityGroupId];

    const group = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
      select: { parentId: true },
    });

    if (group?.parentId) {
      groupIds.push(group.parentId);
    }

    // Auto-complete events that have passed endDate
    await this.autoCompleteExpiredEvents(groupIds);

    const events = await this.eventsRepo.findAll(groupIds);

    if (user.roleType === SystemRoleType.RESIDENT) {
      return events.filter(event => event.status !== EventStatus.DRAFT);
    }

    return events;
  }

  // ==========================================
  // 3. GET EVENT DETAILS + Auto-Complete Check
  // ==========================================
  async getEventDetails(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    // Auto-complete if endDate has passed
    if (
      event.status === EventStatus.ONGOING &&
      event.endDate &&
      new Date(event.endDate) <= new Date()
    ) {
      await this.eventsRepo.updateEventStatus(
        eventId,
        EventStatus.COMPLETED,
        event.createdById,
        'Acara otomatis selesai karena telah melewati tanggal berakhir.'
      );
      const updated = await this.eventsRepo.findById(eventId);
      if (!updated) throw new NotFoundException('Acara tidak ditemukan setelah update');
      return updated;
    }

    return event;
  }

  // ==========================================
  // 4. UPDATE EVENT (DRAFT/REJECTED only)
  // ==========================================
  async updateEvent(eventId: string, updateEventDto: UpdateEventDto, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    if (event.createdById !== user.id) {
      throw new ForbiddenException('Hanya pembuat acara yang dapat mengubah detailnya');
    }

    const editableStatuses: EventStatus[] = [EventStatus.DRAFT, EventStatus.REJECTED];
    if (!editableStatuses.includes(event.status)) {
      throw new BadRequestException('Acara hanya dapat diubah saat berstatus DRAFT atau REJECTED.');
    }

    return this.eventsRepo.updateEvent(eventId, updateEventDto);
  }

  // ==========================================
  // 4.5 DELETE EVENT (DRAFT only)
  // ==========================================
  async deleteEvent(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

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
  // 5. SUBMIT EVENT → SUBMITTED (dikirim ke Treasurer)
  // ==========================================
  async submitEvent(eventId: string, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    const submittableStatuses: EventStatus[] = [EventStatus.DRAFT, EventStatus.REJECTED];
    if (!submittableStatuses.includes(event.status)) {
      throw new BadRequestException(
        `Hanya acara berstatus DRAFT atau REJECTED yang dapat diajukan. Status saat ini: ${event.status}`
      );
    }

    const reason = event.status === EventStatus.REJECTED
      ? 'Pengajuan ulang setelah ditolak'
      : 'Pengajuan awal oleh pembuat acara, menunggu review Bendahara';

    // Generate approval workflow (single step: Treasurer)
    await this.eventApprovalService.generateApprovalWorkflow(eventId);

    return this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SUBMITTED,
      user.id,
      reason
    );
  }

  // ==========================================
  // 6. CANCEL EVENT & REFUND
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

    if (event.status === EventStatus.FUNDED || event.status === EventStatus.ONGOING) {
      await this.financeService.refundEventFund(
        event.communityGroupId,
        Number(event.budgetEstimated),
        event.id,
        `Full Refund akibat Pembatalan Acara: ${reason}`
      );
      this.logger.log(`Refund Full dana event ${eventId} berhasil.`);
    }

    return this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.CANCELLED,
      user.id,
      `Dibatalkan: ${reason}`
    );
  }

  // ==========================================
  // 7. SUBMIT EXPENSE REPORT (Treasurer, FUNDED → ONGOING)
  //    Treasurer menginput daftar belanja, upload bukti nota,
  //    dan sisa uang, lalu submit → status jadi ONGOING
  // ==========================================
  async submitExpenseReport(
    eventId: string,
    dto: SubmitExpenseReportDto,
    receiptFiles: Express.Multer.File[],
    user: ActiveUserData,
  ) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    // Hanya saat FUNDED
    if (event.status !== EventStatus.FUNDED) {
      throw new BadRequestException('Laporan pengeluaran hanya dapat disubmit saat acara berstatus FUNDED');
    }

    // Hanya Treasurer
    if (user.roleType !== SystemRoleType.TREASURER) {
      throw new ForbiddenException('Hanya Bendahara yang dapat menginput laporan pengeluaran');
    }

    // Parse items
    const items: { title: string; amount: number }[] = 
      typeof dto.items === 'string' ? JSON.parse(dto.items) : dto.items;

    if (!items || items.length === 0) {
      throw new BadRequestException('Minimal 1 item pengeluaran harus diinput');
    }

    // Validate items
    for (const item of items) {
      if (!item.title || item.title.trim().length === 0) {
        throw new BadRequestException('Nama item pengeluaran wajib diisi');
      }
      if (!item.amount || item.amount <= 0) {
        throw new BadRequestException('Jumlah pengeluaran harus lebih dari 0');
      }
    }

    const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);
    const remainingAmount = typeof dto.remainingAmount === 'string' 
      ? parseFloat(dto.remainingAmount) 
      : dto.remainingAmount;
    const budgetFunded = Number(event.budgetEstimated);

    // Validate: total expenses + remaining = budget
    const calculatedTotal = totalExpenses + remainingAmount;
    if (Math.abs(calculatedTotal - budgetFunded) > 1) {
      throw new BadRequestException(
        `Total pengeluaran (Rp${totalExpenses.toLocaleString('id-ID')}) + sisa uang (Rp${remainingAmount.toLocaleString('id-ID')}) = Rp${calculatedTotal.toLocaleString('id-ID')} tidak sesuai dengan dana yang dicairkan (Rp${budgetFunded.toLocaleString('id-ID')}). Pastikan input sesuai dengan nota.`
      );
    }

    // Upload receipt images
    const receiptImageUrls: string[] = [];
    if (receiptFiles && receiptFiles.length > 0) {
      for (const file of receiptFiles) {
        const url = await this.storageService.uploadImage(file, 'receipts', 1200, 1200);
        receiptImageUrls.push(url);
      }
    }

    // Create expense records (auto-verified since Treasurer is submitting)
    for (const item of items) {
      await this.eventsRepo.createExpense({
        eventId,
        title: item.title,
        amount: item.amount,
        proofImage: undefined,
      });
      // Auto-verify
      const expenses = await this.prisma.eventExpense.findMany({
        where: { eventId, title: item.title },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      if (expenses[0]) {
        await this.eventsRepo.verifyExpense(expenses[0].id, true, user.id);
      }
    }

    // Store receipt images on event
    await this.prisma.event.update({
      where: { id: eventId },
      data: { 
        receiptImages: receiptImageUrls,
        budgetActual: totalExpenses,
      },
    });

    // Update status to ONGOING
    await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.ONGOING,
      user.id,
      `Laporan pengeluaran diserahkan. Total belanja: Rp${totalExpenses.toLocaleString('id-ID')}. Sisa: Rp${remainingAmount.toLocaleString('id-ID')}. ${receiptImageUrls.length} bukti nota dilampirkan.`
    );

    // Refund remaining amount back to wallet if > 0
    if (remainingAmount > 0) {
      await this.financeService.refundEventFund(
        event.communityGroupId,
        remainingAmount,
        event.id,
        `Pengembalian sisa belanja acara: Rp${remainingAmount.toLocaleString('id-ID')}`
      );
      this.logger.log(`Sisa dana Rp${remainingAmount} event ${eventId} dikembalikan ke wallet.`);
    }

    return {
      message: 'Laporan pengeluaran berhasil disubmit. Acara kini berstatus ONGOING.',
      totalExpenses,
      remainingAmount,
      receiptImages: receiptImageUrls,
    };
  }

  // ==========================================
  // 8. EXTEND EVENT DATE (Leader/Admin, ONGOING)
  // ==========================================
  async extendEventDate(eventId: string, dto: ExtendEventDateDto, user: ActiveUserData) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    if (event.status !== EventStatus.ONGOING) {
      throw new BadRequestException('Waktu acara hanya dapat diperpanjang saat berstatus ONGOING');
    }

    const isCreator = event.createdById === user.id;
    const canExtendRoles: SystemRoleType[] = [SystemRoleType.LEADER, SystemRoleType.ADMIN];
    if (!isCreator && !canExtendRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya pembuat acara atau pengurus yang dapat memperpanjang waktu');
    }

    const newEndDate = new Date(dto.endDate);
    if (event.endDate && newEndDate <= new Date(event.endDate)) {
      throw new BadRequestException('Tanggal selesai baru harus lebih besar dari tanggal selesai saat ini');
    }

    await this.eventsRepo.updateEvent(eventId, { endDate: newEndDate });

    await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.ONGOING,
      user.id,
      `Waktu acara diperpanjang hingga ${newEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    );

    return { message: 'Waktu acara berhasil diperpanjang', newEndDate };
  }

  // ==========================================
  // 9. SETTLE EVENT (Leader/Admin, COMPLETED → SETTLED)
  //    Input hasil event, foto hasil, deskripsi
  // ==========================================
  async settleEvent(
    eventId: string,
    user: ActiveUserData,
    description: string,
    resultFiles: Express.Multer.File[],
  ) {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException('Acara tidak ditemukan');
    await this.checkGroupAccess(event.communityGroupId, user);

    if (event.status !== EventStatus.COMPLETED) {
      throw new BadRequestException('Hanya acara berstatus COMPLETED yang dapat diselesaikan laporannya');
    }

    const canSettleRoles: SystemRoleType[] = [SystemRoleType.LEADER, SystemRoleType.ADMIN];
    if (!canSettleRoles.includes(user.roleType)) {
      throw new ForbiddenException('Hanya Ketua atau Admin yang dapat menyelesaikan laporan acara');
    }

    // Upload result photos
    const resultImageUrls: string[] = [];
    if (resultFiles && resultFiles.length > 0) {
      for (const file of resultFiles) {
        const url = await this.storageService.uploadImage(file, 'event-results', 1200, 1200);
        resultImageUrls.push(url);
      }
    }

    // Update event with results
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        resultDescription: description,
        resultImages: resultImageUrls,
      },
    });

    // Update status to SETTLED
    const photoInfo = resultImageUrls.length > 0 
      ? `${resultImageUrls.length} foto dokumentasi dilampirkan. ` 
      : '';

    const settledEvent = await this.eventsRepo.updateEventStatus(
      eventId,
      EventStatus.SETTLED,
      user.id,
      `Laporan: ${description}. ${photoInfo}Acara telah diselesaikan.`
    );

    return {
      message: 'Laporan acara berhasil ditutup',
      resultImages: resultImageUrls,
      event: settledEvent
    };
  }

  // ==========================================
  // HELPER: Auto-Complete expired ONGOING events
  // ==========================================
  private async autoCompleteExpiredEvents(groupIds: number[]) {
    const expiredEvents = await this.prisma.event.findMany({
      where: {
        communityGroupId: { in: groupIds },
        status: EventStatus.ONGOING,
        endDate: { lte: new Date() },
      },
    });

    for (const event of expiredEvents) {
      await this.eventsRepo.updateEventStatus(
        event.id,
        EventStatus.COMPLETED,
        event.createdById,
        'Acara otomatis selesai karena telah melewati tanggal berakhir.'
      );
      this.logger.log(`Event ${event.id} auto-completed (endDate passed).`);
    }
  }
}