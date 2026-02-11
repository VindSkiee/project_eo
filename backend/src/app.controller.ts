import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@common/decorators'; // Pakai alias yang sudah kita setup

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public() 
  @Get()
  getHealthCheck() {
    return this.appService.getHealthStatus();
  }
}