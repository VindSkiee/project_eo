import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

import { GroupsService } from '../services/groups.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupFilterDto } from '../dto/group-filter.dto';

// Security / Decorators
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator'; // <--- IMPORT BARU
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  /**
   * CREATE GROUP
   * Security: Hanya LEADER (RW)
   */
  @Post()
  @Roles(SystemRoleType.LEADER)
  create(
    @ActiveUser() user: ActiveUserData, // <--- Tangkap User Login
    @Body() createGroupDto: CreateGroupDto
  ) {
    // Kita lempar data user ke service (misal untuk audit log: "Dibuat oleh Pak RW A")
    return this.groupsService.create(createGroupDto, user);
  }

  /**
   * GET HIERARCHY WITH OFFICERS
   * Security: Semua User Login
   */
  @Get('hierarchy')
  getHierarchy(@ActiveUser() user: ActiveUserData) {
    return this.groupsService.getHierarchy(user);
  }

  /**
   * FIND ALL
   * Security: Semua User Login (Authenticated)
   */
  @Get()
  findAll(
    @ActiveUser() user: ActiveUserData, // <--- Tangkap User (opsional, jika butuh log siapa yg liat)
    @Query() filterDto: GroupFilterDto
  ) {
    return this.groupsService.findAll(filterDto);
  }

  /**
   * FIND ONE
   * Security: Semua User Login
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  /**
   * UPDATE GROUP
   * Security: Hanya LEADER (RW)
   */
  @Patch(':id')
  @Roles(SystemRoleType.LEADER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @ActiveUser() user: ActiveUserData // <--- Tangkap User Login
  ) {
    return this.groupsService.update(id, updateGroupDto, user);
  }

  /**
   * DELETE GROUP
   * Security: Hanya LEADER (RW)
   */
  @Delete(':id')
  @Roles(SystemRoleType.LEADER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserData // <--- Tangkap User Login (Penting untuk Audit)
  ) {
    return this.groupsService.remove(id, user);
  }
}