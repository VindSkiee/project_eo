import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

// Imports Decorator & Types
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

// Imports Services
import { EventsService } from '../services/events.service';
import { EventApprovalService } from '../services/event-approval.service';

// Imports DTOs
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { ProcessApprovalDto } from '../dto/process-approval.dto';
import { CancelEventDto } from '../dto/cancel-event.dto';
import { SubmitExpenseDto } from '../dto/submit-expense.dto';
import { VerifyExpenseDto } from '../dto/verify-expense.dto';


@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventApprovalService: EventApprovalService,
  ) { }

  // ==========================================
  // 1. ENDPOINT KHUSUS PENGURUS (CREATE & MANAGE)
  // ==========================================

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @ActiveUser() user: ActiveUserData,
    @Body() body: { data: CreateEventDto; committeeUserIds?: string[] }
  ) {
    // Memisahkan data detail acara dan daftar panitia dari body request
    return this.eventsService.createEvent(body.data, user, body.committeeUserIds);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Patch(':id')
  async updateEvent(
    @Param('id') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.updateEvent(eventId, updateEventDto, user);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(
    @Param('id') eventId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.deleteEvent(eventId, user);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitEvent(
    @Param('id') eventId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    // 1. Ubah status menjadi SUBMITTED
    await this.eventsService.submitEvent(eventId, user);

    // 2. Mesin otomatis membaca anggaran dan membuat rantai persetujuan (RT/RW)
    return this.eventApprovalService.generateApprovalWorkflow(eventId);
  }

  // ==========================================
  // 2. ENDPOINT APPROVAL (KHUSUS PENGURUS)
  // ==========================================

  @Roles(SystemRoleType.ADMIN, SystemRoleType.TREASURER, SystemRoleType.LEADER)
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param('id') eventId: string,
    @Body() processApprovalDto: ProcessApprovalDto,
    @ActiveUser() user: ActiveUserData
  ) {
    // Logika validasi apakah "Bukan Giliran Anda" sudah ditangani di dalam Service
    return this.eventApprovalService.processApproval(eventId, user, processApprovalDto);
  }

  // Jangan lupa import CancelEventDto di atas
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelEvent(
    @Param('id') eventId: string,
    @Body() cancelEventDto: CancelEventDto, // <-- REFACTOR DI SINI
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.cancelEvent(eventId, cancelEventDto.reason, user);
  }

  // ==========================================
  // 3. ENDPOINT PUBLIK / WARGA (TRANSPARANSI)
  // ==========================================

  // Tidak memakai @Roles() agar warga (RESIDENT) bisa mengaksesnya
  @Get()
  async getAllEvents(@ActiveUser() user: ActiveUserData) {
    // Warga hanya akan melihat data dari lingkungan RT/RW mereka sendiri
    // dan acara berstatus DRAFT akan disembunyikan otomatis oleh Service
    return this.eventsService.findAllEvents(user);
  }

  @Get(':id')
  async getEventDetails(
    @Param('id') eventId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.getEventDetails(eventId, user);
  }

  // ==========================================
  // 4. EXPENSE MANAGEMENT
  // ==========================================
  @Roles(SystemRoleType.TREASURER)
  @Post(':id/expenses')
  @HttpCode(HttpStatus.CREATED)
  async submitExpense(
    @Param('id') eventId: string,
    @Body() dto: SubmitExpenseDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.submitEventExpense(eventId, dto, user);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Patch('expenses/:expenseId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyExpense(
    @Param('expenseId') expenseId: string,
    @Body() dto: VerifyExpenseDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.verifyExpense(expenseId, dto, user);
  }

  @Roles(SystemRoleType.LEADER, SystemRoleType.ADMIN)
  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  async settleEvent(
    @Param('id') eventId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.settleEvent(eventId, user);
  }

}