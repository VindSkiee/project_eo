import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { UpsertRoleLabelDto } from './dto/upsert-role-label.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET all role labels for the requester's RW group hierarchy.
   * Returns labels for the RW group itself (covers all RT children).
   */
  async getRoleLabels(requester: ActiveUserData) {
    // Determine the RW group ID
    const rwGroupId = await this.resolveRwGroupId(requester);

    const labels = await this.prisma.roleLabelSetting.findMany({
      where: { communityGroupId: rwGroupId },
      orderBy: { roleType: 'asc' },
    });

    return labels;
  }

  /**
   * UPSERT a role label (create or update).
   * Only LEADER can do this.
   */
  async upsertRoleLabel(requester: ActiveUserData, dto: UpsertRoleLabelDto) {
    const rwGroupId = await this.resolveRwGroupId(requester);

    const result = await this.prisma.roleLabelSetting.upsert({
      where: {
        roleType_communityGroupId: {
          roleType: dto.roleType,
          communityGroupId: rwGroupId,
        },
      },
      update: {
        label: dto.label,
      },
      create: {
        roleType: dto.roleType,
        label: dto.label,
        communityGroupId: rwGroupId,
      },
    });

    return result;
  }

  /**
   * DELETE a custom role label (revert to default).
   */
  async deleteRoleLabel(requester: ActiveUserData, roleType: SystemRoleType) {
    const rwGroupId = await this.resolveRwGroupId(requester);

    const existing = await this.prisma.roleLabelSetting.findUnique({
      where: {
        roleType_communityGroupId: {
          roleType,
          communityGroupId: rwGroupId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Label role tidak ditemukan');
    }

    await this.prisma.roleLabelSetting.delete({
      where: { id: existing.id },
    });

    return { message: 'Label berhasil dihapus, kembali ke default' };
  }

  /**
   * PUBLIC: Get role labels by RW group ID (for frontend consumption).
   * Called by any authenticated user to fetch their community's labels.
   */
  async getRoleLabelsByGroup(requester: ActiveUserData) {
    const rwGroupId = await this.resolveRwGroupId(requester);

    const labels = await this.prisma.roleLabelSetting.findMany({
      where: { communityGroupId: rwGroupId },
    });

    // Return as a map: { LEADER: "RW 05", ADMIN: "RT 01", ... }
    const labelMap: Record<string, string> = {};
    for (const label of labels) {
      labelMap[label.roleType] = label.label;
    }

    return labelMap;
  }

  // --- Private Helpers ---

  /**
   * Resolve the RW group ID from the requester's context.
   * LEADER → their own group (which is RW type).
   * ADMIN/TREASURER/RESIDENT → their group's parent (which is RW).
   */
  private async resolveRwGroupId(requester: ActiveUserData): Promise<number> {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: requester.communityGroupId },
      select: { id: true, type: true, parentId: true },
    });

    if (!group) {
      throw new NotFoundException('Community group tidak ditemukan');
    }

    if (group.type === 'RW') {
      return group.id;
    }

    // RT → return parent RW
    if (group.parentId) {
      return group.parentId;
    }

    throw new ForbiddenException('Tidak dapat menentukan grup RW');
  }
}
