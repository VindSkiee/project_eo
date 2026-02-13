import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { GroupsController } from './controllers/groups.controller';
import { UsersService } from './services/users.service';
import { GroupsService } from './services/groups.service';
import { UsersRepository } from './repositories/users.repository';
import { GroupsRepository } from './repositories/groups.repository';

@Module({
  controllers: [UsersController, GroupsController],
  providers: [UsersService, GroupsService, UsersRepository, GroupsRepository],
  exports: [UsersService, GroupsService, UsersRepository, GroupsRepository],
})
export class CommunityModule {}
