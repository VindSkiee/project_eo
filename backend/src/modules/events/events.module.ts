import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventApprovalService } from './event-approval.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventApprovalService],
  exports: [EventsService, EventApprovalService],
})
export class EventsModule {}
