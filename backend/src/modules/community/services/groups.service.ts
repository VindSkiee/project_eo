import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SystemRoleType, CommunityGroup } from '@prisma/client';

import { GroupsRepository } from '../repositories/groups.repository';
import { PrismaService } from '../../../database/prisma.service'; // Akses langsung Prisma untuk helper query

import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupFilterDto } from '../dto/group-filter.dto';
import { ActiveUserData } from '@common/decorators/active-user.decorator';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  /**
   * CREATE GROUP
   * Logic Baru: 
   * - Jika Type = 'RT', kita harus set Parent ID (RW).
   * - Untuk MVP, kita asumsikan hanya ada 1 RW Pusat. 
   * Atau nanti bisa dikirim via DTO.
   */
  async create(dto: CreateGroupDto, user?: ActiveUserData): Promise<CommunityGroup> {
    
    let parentId: number | null = null;

    // Logic: Jika membuat RT, otomatis kaitkan ke RW yang ada
    if (dto.type === 'RT') {
      // Cari RW pertama yang ada di database (Sistem Single RW)
      const parentRw = await this.prisma.communityGroup.findFirst({
        where: { type: 'RW' },
      });

      if (!parentRw) {
        throw new BadRequestException('Belum ada RW yang terdaftar. Buat RW terlebih dahulu.');
      }
      parentId = parentRw.id;
    }

    return this.groupsRepository.createWithWallet({
      name: dto.name,
      type: dto.type,
      // Hubungkan ke Parent (RW) jika ini RT
      parent: parentId ? { connect: { id: parentId } } : undefined,
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
        leader: leader ? { id: leader.id, fullName: leader.fullName, email: leader.email, phone: leader.phone } : null,
        treasurer: rwTreasurer ? { id: rwTreasurer.id, fullName: rwTreasurer.fullName, email: rwTreasurer.email, phone: rwTreasurer.phone } : null,
      },
      rtGroups: rwGroup.children.map((rt) => {
        const admin = rt.users.find((u) => u.role.type === 'ADMIN');
        const rtTreasurer = rt.users.find((u) => u.role.type === 'TREASURER');
        return {
          id: rt.id,
          name: rt.name,
          type: 'RT' as const,
          memberCount: rt._count.users,
          admin: admin ? { id: admin.id, fullName: admin.fullName, email: admin.email, phone: admin.phone } : null,
          treasurer: rtTreasurer ? { id: rtTreasurer.id, fullName: rtTreasurer.fullName, email: rtTreasurer.email, phone: rtTreasurer.phone } : null,
        };
      }),
    };
  }
}