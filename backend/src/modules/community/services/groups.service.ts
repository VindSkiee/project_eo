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
}