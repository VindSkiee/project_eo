import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@common/decorators'; // Pakai alias yang sudah kita setup
import { SkipThrottle } from '@nestjs/throttler/dist/throttler.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHealthCheck() {
    return this.appService.getHealthStatus();
  }

  @Public()       // 👈 Wajib: Agar Cron Job tidak perlu login/token
  @SkipThrottle() // 👈 Wajib: Agar Cron Job tidak kena blokir rate limit
  @Get('ping')
  ping() {
    return 'pong'; // Response super ringan (4 bytes text)
  }
}