import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, CommunityGroup } from '@prisma/client';

// 1. TYPE CUSTOM
// Group Basic + Wallet
export type GroupWithWallet = Prisma.CommunityGroupGetPayload<{
  include: { 
    wallet: true;
  };
}>;

// Group Lengkap (Wallet + Info Parent/Children)
// Ini dipakai untuk detail page: "RT 01 (Induk: RW 05)"
export type GroupWithHierarchy = Prisma.CommunityGroupGetPayload<{
  include: { 
    wallet: true;
    parent: true;
    children: true;
  };
}>;

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREATE GROUP + WALLET
   * Menggunakan spread operator (...data) aman, 
   * field 'parent' otomatis masuk jika dikirim dari Service.
   */
  async createWithWallet(data: Prisma.CommunityGroupCreateInput): Promise<CommunityGroup> {
    return this.prisma.communityGroup.create({
      data: {
        ...data,
        // Kita paksa wallet dibuat kosong, menimpa kalau ada input wallet dari 'data'
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
    });
  }

  /**
   * FIND BY ID (Standard)
   */
  async findById(id: number): Promise<GroupWithWallet | null> {
    return this.prisma.communityGroup.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });
  }

  /**
   * FIND BY ID (Lengkap dengan Hierarki)
   * Method baru agar Service tidak perlu inject PrismaService langsung
   */
  async findByIdWithHierarchy(id: number): Promise<GroupWithHierarchy | null> {
    return this.prisma.communityGroup.findUnique({
      where: { id },
      include: {
        wallet: true,
        parent: true,   // Include Data RW Induk
        children: true, // Include Data RT Anak (jika ini RW)
      },
    });
  }

  /**
   * FIND ALL (Flexible)
   */
  async findAll(params: {
    where?: Prisma.CommunityGroupWhereInput;
    orderBy?: Prisma.CommunityGroupOrderByWithRelationInput;
  }): Promise<CommunityGroup[]> {
    const { where, orderBy } = params;

    return this.prisma.communityGroup.findMany({
      where,
      orderBy: orderBy || { name: 'asc' },
    });
  }

  /**
   * Update Group
   */
  async update(id: number, data: Prisma.CommunityGroupUpdateInput): Promise<CommunityGroup> {
    return this.prisma.communityGroup.update({
      where: { id },
      data,
    });
  }

  /**
   * Exists Check
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.communityGroup.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Delete Group
   */
  async delete(id: number): Promise<CommunityGroup> {
    return this.prisma.communityGroup.delete({
      where: { id },
    });
  }
}