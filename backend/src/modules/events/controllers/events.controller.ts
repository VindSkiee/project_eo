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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { SubmitExpenseReportDto } from '../dto/submit-expense-report.dto';
import { ExtendEventDateDto } from '../dto/extend-event-date.dto';


@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventApprovalService: EventApprovalService,
  ) { }

  // ==========================================
  // 1. ENDPOINT KHUSUS PENGURUS (CREATE & MANAGE)
  // ==========================================

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @ActiveUser() user: ActiveUserData,
    @Body() body: { data: CreateEventDto; committeeUserIds?: string[] }
  ) {
    return this.eventsService.createEvent(body.data, user, body.committeeUserIds);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
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

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitEvent(
    @Param('id') eventId: string,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.submitEvent(eventId, user);
  }

  // ==========================================
  // 2. ENDPOINT APPROVAL (KHUSUS TREASURER)
  // ==========================================

  @Roles(SystemRoleType.TREASURER)
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param('id') eventId: string,
    @Body() processApprovalDto: ProcessApprovalDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventApprovalService.processApproval(eventId, user, processApprovalDto);
  }

  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelEvent(
    @Param('id') eventId: string,
    @Body() cancelEventDto: CancelEventDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.cancelEvent(eventId, cancelEventDto.reason, user);
  }

  // ==========================================
  // 3. ENDPOINT PUBLIK / WARGA (TRANSPARANSI)
  // ==========================================

  @Get()
  async getAllEvents(@ActiveUser() user: ActiveUserData) {
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
  // 4. EXPENSE REPORT (Treasurer, FUNDED → ONGOING)
  //    Upload bukti nota + daftar belanja + sisa uang
  // ==========================================
  @Roles(SystemRoleType.TREASURER)
  @Post(':id/expense-report')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('receipts', 10))
  async submitExpenseReport(
    @Param('id') eventId: string,
    @Body() dto: SubmitExpenseReportDto,
    @UploadedFiles() receiptFiles: Express.Multer.File[],
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.eventsService.submitExpenseReport(eventId, dto, receiptFiles || [], user);
  }

  // ==========================================
  // 5. EXTEND EVENT DATE (Leader/Admin, ONGOING)
  // ==========================================
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  @Patch(':id/extend-date')
  @HttpCode(HttpStatus.OK)
  async extendEventDate(
    @Param('id') eventId: string,
    @Body() dto: ExtendEventDateDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.eventsService.extendEventDate(eventId, dto, user);
  }

  // ==========================================
  // 6. SETTLE EVENT (Leader/Admin, COMPLETED → SETTLED)
  //    Upload foto hasil + deskripsi laporan
  // ==========================================
  @Roles(SystemRoleType.LEADER, SystemRoleType.ADMIN)
  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('photos', 10))
  async settleEvent(
    @Param('id') eventId: string,
    @Body('description') description: string,
    @UploadedFiles() resultFiles: Express.Multer.File[],
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.eventsService.settleEvent(eventId, user, description, resultFiles || []);
  }

}