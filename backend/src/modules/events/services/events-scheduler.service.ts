import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from './events.service';

@Injectable()
export class EventsSchedulerService {
  private readonly logger = new Logger(EventsSchedulerService.name);

  constructor(private readonly eventsService: EventsService) {}

  /**
   * Setiap jam: auto-cancel semua event yang telah melewati endDate
   * tanpa konfirmasi ONGOING oleh bendahara RT.
   * - Event tanpa dana (DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED): langsung dibatalkan.
   * - Event sudah FUNDED: dana dikembalikan ke sumber masing-masing (RT & RW).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredEventCancellation() {
    this.logger.log('[SCHEDULER] Menjalankan pengecekan auto-cancel event kadaluarsa...');
    try {
      await this.eventsService.autoCancelExpiredEvents();
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error('[SCHEDULER] Gagal menjalankan auto-cancel:', error.stack);
    }
  }
}
