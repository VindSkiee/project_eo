import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventApprovalService } from './event-approval.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventApprovalService: EventApprovalService,
  ) {}

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  async create(@Body() createEventDto: any) {
    return this.eventsService.create(createEventDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return this.eventsService.publish(id);
  }

  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.eventsService.unpublish(id);
  }

  // Approval endpoints
  @Post(':id/submit-approval')
  async submitForApproval(@Param('id') id: string) {
    return this.eventApprovalService.submitForApproval(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { approverId: string }) {
    return this.eventApprovalService.approve(id, body.approverId);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { approverId: string; reason: string },
  ) {
    return this.eventApprovalService.reject(id, body.approverId, body.reason);
  }

  @Get(':id/approval-status')
  async getApprovalStatus(@Param('id') id: string) {
    return this.eventApprovalService.getApprovalStatus(id);
  }
}
