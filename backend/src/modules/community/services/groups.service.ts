import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SystemRoleType, CommunityGroup, Prisma } from '@prisma/client';

import { GroupsRepository } from '../repositories/groups.repository';
import { PrismaService } from '../../../database/prisma.service';

import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupFilterDto } from '../dto/group-filter.dto';
import { ActiveUserData } from '@common/decorators/active-user.decorator';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * CREATE GROUP
   * Logic Baru: 
   * - Jika Type = 'RT', kita harus set Parent ID (RW).
   * - Untuk MVP, kita asumsikan hanya ada 1 RW Pusat. 
   * Atau nanti bisa dikirim via DTO.
   */
  async create(dto: CreateGroupDto, user?: ActiveUserData): Promise<CommunityGroup> {

    let parentId: number | null = null;

    if (dto.type === 'RT') {
      const parentRw = await this.prisma.communityGroup.findFirst({
        where: { type: 'RW' },
      });

      if (!parentRw) {
        throw new BadRequestException('Belum ada RW yang terdaftar. Buat RW terlebih dahulu.');
      }
      parentId = parentRw.id;
    }

    // Gunakan transaction: buat group + wallet + default approval rules
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.communityGroup.create({
        data: {
          name: dto.name,
          type: dto.type,
          parent: parentId ? { connect: { id: parentId } } : undefined,
          wallet: { create: { balance: 0 } },
        },
      });

      // Auto-create default approval rules
      await this.createDefaultApprovalRules(group.id, group.type, tx);

      return group;
    });
  }

  /**
   * FIND ALL (Filter & Search)
   */
  async findAll(dto: GroupFilterDto): Promise<CommunityGroup[]> {
    const { type, search } = dto;

    return this.groupsRepository.findAll({
      where: {
        type: type ? { equals: type } : undefined,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * FIND ONE
   * Update: Include Parent & Children info
   */
  async findOne(id: number) {
    // Kita akses Prisma langsung disini untuk custom include
    // Atau update Repository findById agar support include dinamis
    const group = await this.prisma.communityGroup.findUnique({
      where: { id },
      include: {
        wallet: true,
        parent: true,   // Tampilkan Induknya (RW)
        children: true, // Tampilkan Anaknya (RT)
      },
    });

    if (!group) {
      throw new NotFoundException(`Group dengan ID ${id} tidak ditemukan`);
    }

    return group;
  }

  /**
   * UPDATE GROUP
   */
  async update(id: number, dto: UpdateGroupDto, user?: ActiveUserData): Promise<CommunityGroup> {
    await this.findOne(id);

    return this.groupsRepository.update(id, {
      name: dto.name,
      type: dto.type,
    });
  }

  /**
   * DELETE GROUP
   */
  async remove(id: number, user?: ActiveUserData): Promise<CommunityGroup> {
    await this.findOne(id);
    return this.groupsRepository.delete(id);
  }

  /**
   * =========================================
   * HELPER METHODS (Untuk Logic Approval)
   * =========================================
   */

  /**
   * Helper: Cari Bendahara (Treasurer) dari Parent Group (RW)
   * Digunakan saat Event RT > 1 Juta
   */
  async findParentTreasurer(rtGroupId: number) {
    // 1. Ambil Group RT beserta Parent-nya
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: rtGroupId },
      include: { parent: true },
    });

    if (!group) throw new NotFoundException('Group tidak ditemukan');

    // Jika ini RW, maka tidak punya parent treasurer (Logic berhenti)
    if (group.type === 'RW') return null;

    if (!group.parentId) {
      // RT yatim piatu (Data tidak konsisten)
      throw new BadRequestException('RT ini tidak terhubung dengan RW manapun');
    }

    // 2. Cari User TREASURER di Group RW (Parent)
    const treasurer = await this.prisma.user.findFirst({
      where: {
        communityGroupId: group.parentId,
        role: {
          type: SystemRoleType.TREASURER, // Pastikan Enum SystemRoleType di-import
        },
        isActive: true, // Hanya cari bendahara aktif
      },
    });

    if (!treasurer) {
      // Warning: RW belum punya bendahara
      throw new BadRequestException('RW Pusat belum memiliki Bendahara Aktif');
    }

    return treasurer;
  }

  /**
   * GET HIERARCHY WITH OFFICERS
   * Returns the RW + all RT hierarchy with key officers (admin, treasurer) and member counts.
   */
  async getHierarchy(user: ActiveUserData) {
    // Determine the RW group
    let rwGroupId: number;

    const userGroup = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
      select: { type: true, parentId: true },
    });

    if (!userGroup) throw new NotFoundException('Data lingkungan tidak ditemukan');

    if (userGroup.type === 'RW') {
      rwGroupId = user.communityGroupId;
    } else if (userGroup.parentId) {
      rwGroupId = userGroup.parentId;
    } else {
      rwGroupId = user.communityGroupId;
    }

    const rwGroup = await this.prisma.communityGroup.findUnique({
      where: { id: rwGroupId },
      include: {
        users: {
          where: {
            role: { type: { in: [SystemRoleType.LEADER, SystemRoleType.TREASURER] } },
            isActive: true,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true, // <--- 1. TAMBAHKAN INI DI RW USERS
            role: { select: { type: true } },
          },
        },
        children: {
          orderBy: { name: 'asc' },
          include: {
            users: {
              where: {
                role: { type: { in: [SystemRoleType.ADMIN, SystemRoleType.TREASURER] } },
                isActive: true,
              },
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                profileImage: true, // <--- 2. TAMBAHKAN INI DI RT USERS
                role: { select: { type: true } },
              },
            },
            _count: { select: { users: true } },
          },
        },
        _count: { select: { users: true } },
      },
    });

    if (!rwGroup) throw new NotFoundException('Data RW tidak ditemukan');

    const leader = rwGroup.users.find((u) => u.role.type === 'LEADER');
    const rwTreasurer = rwGroup.users.find((u) => u.role.type === 'TREASURER');

    return {
      rw: {
        id: rwGroup.id,
        name: rwGroup.name,
        type: 'RW' as const,
        memberCount: rwGroup._count.users,
        // 3. Masukkan profileImage ke dalam hasil return map-nya
        leader: leader ? { id: leader.id, fullName: leader.fullName, email: leader.email, phone: leader.phone, profileImage: leader.profileImage } : null,
        treasurer: rwTreasurer ? { id: rwTreasurer.id, fullName: rwTreasurer.fullName, email: rwTreasurer.email, phone: rwTreasurer.phone, profileImage: rwTreasurer.profileImage } : null,
      },
      rtGroups: rwGroup.children.map((rt) => {
        const admin = rt.users.find((u) => u.role.type === 'ADMIN');
        const rtTreasurer = rt.users.find((u) => u.role.type === 'TREASURER');
        return {
          id: rt.id,
          name: rt.name,
          type: 'RT' as const,
          memberCount: rt._count.users,
          // 4. Masukkan profileImage ke dalam hasil return map RT-nya
          admin: admin ? { id: admin.id, fullName: admin.fullName, email: admin.email, phone: admin.phone, profileImage: admin.profileImage } : null,
          treasurer: rtTreasurer ? { id: rtTreasurer.id, fullName: rtTreasurer.fullName, email: rtTreasurer.email, phone: rtTreasurer.phone, profileImage: rtTreasurer.profileImage } : null,
        };
      }),
    };
  }

  // ==========================================
  // DEFAULT APPROVAL RULES
  // ==========================================

  /**
   * Buat default ApprovalRules untuk sebuah CommunityGroup.
   * - RT: Step 1 = TREASURER, Step 2 = ADMIN
   * - RW: Step 1 = TREASURER, Step 2 = LEADER
   * 
   * @param groupId - ID CommunityGroup
   * @param groupType - 'RT' atau 'RW'
   * @param tx - Prisma transaction client (opsional, fallback ke this.prisma)
   */
  async createDefaultApprovalRules(
    groupId: number,
    groupType: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    // Tentukan role yang dibutuhkan berdasarkan tipe group
    const roleSteps: { type: SystemRoleType; stepOrder: number }[] =
      groupType === 'RW'
        ? [
          { type: SystemRoleType.TREASURER, stepOrder: 1 },
          { type: SystemRoleType.LEADER, stepOrder: 2 },
        ]
        : [
          { type: SystemRoleType.TREASURER, stepOrder: 1 },
          { type: SystemRoleType.ADMIN, stepOrder: 2 },
        ];

    // Query roleId berdasarkan SystemRoleType (JANGAN hardcode angka!)
    const roles = await client.role.findMany({
      where: { type: { in: roleSteps.map((r) => r.type) } },
    });

    const roleMap = new Map(roles.map((r) => [r.type, r.id]));

    const rulesToCreate = roleSteps
      .filter((step) => {
        const roleId = roleMap.get(step.type);
        if (!roleId) {
          this.logger.warn(
            `Role ${step.type} tidak ditemukan di database, skip step ${step.stepOrder} untuk group ${groupId}`,
          );
          return false;
        }
        return true;
      })
      .map((step) => ({
        communityGroupId: groupId,
        roleId: roleMap.get(step.type)!,
        stepOrder: step.stepOrder,
        isMandatory: true,
        isCrossGroup: false,
        minAmount: null,
      }));

    if (rulesToCreate.length === 0) {
      this.logger.warn(
        `Tidak ada role yang valid untuk membuat ApprovalRules di group ${groupId}`,
      );
      return 0;
    }

    // Gunakan skipDuplicates agar aman dipanggil berulang (idempotent)
    const result = await client.approvalRule.createMany({
      data: rulesToCreate,
      skipDuplicates: true,
    });

    this.logger.log(
      `Default ApprovalRules dibuat untuk group ${groupId} (${groupType}): ${result.count} rules`,
    );

    return result.count;
  }

  /**
   * Fix: Buat default ApprovalRules untuk semua group yang belum memiliki rules.
   * Mengembalikan jumlah group yang diperbaiki.
   */
  async fixMissingApprovalRules(): Promise<{ fixedGroups: number; totalRulesCreated: number }> {
    // Cari semua group yang belum punya ApprovalRule
    const groupsWithoutRules = await this.prisma.communityGroup.findMany({
      where: {
        approvalRules: { none: {} },
      },
      select: { id: true, type: true, name: true },
    });

    if (groupsWithoutRules.length === 0) {
      return { fixedGroups: 0, totalRulesCreated: 0 };
    }

    let totalRulesCreated = 0;

    // Proses dalam satu transaksi
    await this.prisma.$transaction(async (tx) => {
      for (const group of groupsWithoutRules) {
        const count = await this.createDefaultApprovalRules(group.id, group.type, tx);
        totalRulesCreated += count;
        this.logger.log(`Fixed: ${group.name} (${group.type}) - ${count} rules created`);
      }
    });

    return {
      fixedGroups: groupsWithoutRules.length,
      totalRulesCreated,
    };
  }
}