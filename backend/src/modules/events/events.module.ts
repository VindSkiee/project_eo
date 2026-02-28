import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventApprovalService } from './services/event-approval.service';
import { EventsRepository } from './events.repository';
import { FundRequestsService } from './services/fund-requests.service';
import { FundRequestsController } from './controllers/fund-requests.controller';
import { EventsSchedulerService } from './services/events-scheduler.service';
import { FinanceModule } from '@modules/finance/finance.module';

@Module({
  imports: [FinanceModule],
  controllers: [EventsController, FundRequestsController],
  providers: [EventsService, EventApprovalService, FundRequestsService, EventsRepository, EventsSchedulerService],
  exports: [EventsService, EventApprovalService, FundRequestsService, EventsRepository],
})
export class EventsModule {}
