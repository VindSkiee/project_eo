import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SetDuesDto } from '../dto/set-dues.dto';

@Injectable()
export class DuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. UPSERT RULE (Setting Harga)
  // ==========================================
  async upsertDuesRule(communityGroupId: number, dto: SetDuesDto) {
    return this.prisma.duesRule.upsert({
      where: { communityGroupId },
      update: {
        amount: dto.amount,
        dueDay: dto.dueDay,
        isActive: true,
      },
      create: {
        communityGroupId,
        amount: dto.amount,
        dueDay: dto.dueDay,
        isActive: true,
      },
    });
  }

  // ==========================================
  // 2. GET GROUP WITH HIERARCHY (Untuk Hitung Split)
  // ==========================================
  // Query ini sangat krusial. Kita mengambil:
  // - Data Grup User (RT) + Aturan Iurannya
  // - Data Grup Induk (RW) + Aturan Iurannya
  async findGroupHierarchyWithRules(communityGroupId: number) {
    return this.prisma.communityGroup.findUnique({
      where: { id: communityGroupId },
      include: {
        duesRule: true, // Ambil Aturan RT
        parent: {       // Ambil Parent (RW)
          include: {
            duesRule: true, // Ambil Aturan RW
          },
        },
      },
    });
  }

  // ==========================================
  // 3. FIND USER WITH GROUP (Helper untuk Distribusi)
  // ==========================================
  async findUserWithGroup(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        communityGroup: {
          include: {
            duesRule: true,
            parent: {
              include: { duesRule: true },
            },
          },
        },
      },
    });
  }

  async updateUserLastPaidPeriod(userId: string, date: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastPaidPeriod: date }
    });
  }

  // ==========================================
  // 4. GET DUES CONFIG (Untuk Halaman Pengaturan)
  // ==========================================
  async findDuesConfigByGroupId(communityGroupId: number) {
    return this.prisma.communityGroup.findUnique({
      where: { id: communityGroupId },
      include: {
        duesRule: true,
        children: {
          include: {
            duesRule: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }
}