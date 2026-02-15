import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './services/finance.service';
import { DuesService } from './services/dues.service';
import { DuesRepository } from './repositories/dues.repository';
import { FinanceRepository } from './repositories/finance.repository';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, DuesService, DuesRepository, FinanceRepository],
  exports: [FinanceService, DuesService, DuesRepository, FinanceRepository],
})
export class FinanceModule {}
