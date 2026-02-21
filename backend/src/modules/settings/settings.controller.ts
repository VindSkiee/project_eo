import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

import { SettingsService } from './settings.service';
import { UpsertRoleLabelDto } from './dto/upsert-role-label.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /api/settings/role-labels
   * Returns all custom role labels for the requester's RW community.
   * Accessible by LEADER only for the management page.
   */
  @Get('role-labels')
  @Roles(SystemRoleType.LEADER)
  getRoleLabels(@ActiveUser() requester: ActiveUserData) {
    return this.settingsService.getRoleLabels(requester);
  }

  /**
   * GET /api/settings/role-labels/map
   * Returns role labels as a simple { ROLE: "label" } map.
   * Accessible by ALL authenticated users (for frontend display).
   */
  @Get('role-labels/map')
  getRoleLabelsMap(@ActiveUser() requester: ActiveUserData) {
    return this.settingsService.getRoleLabelsByGroup(requester);
  }

  /**
   * POST /api/settings/role-labels
   * Create or update a custom role label.
   * LEADER only.
   */
  @Post('role-labels')
  @Roles(SystemRoleType.LEADER)
  upsertRoleLabel(
    @ActiveUser() requester: ActiveUserData,
    @Body() dto: UpsertRoleLabelDto,
  ) {
    return this.settingsService.upsertRoleLabel(requester, dto);
  }

  /**
   * DELETE /api/settings/role-labels/:roleType
   * Remove a custom label (revert to default).
   * LEADER only.
   */
  @Delete('role-labels/:roleType')
  @Roles(SystemRoleType.LEADER)
  deleteRoleLabel(
    @ActiveUser() requester: ActiveUserData,
    @Param('roleType') roleType: SystemRoleType,
  ) {
    return this.settingsService.deleteRoleLabel(requester, roleType);
  }
}
