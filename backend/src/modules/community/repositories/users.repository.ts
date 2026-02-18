import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, User } from '@prisma/client';

// 1. DEFINISI TYPE (Wajib ada Wallet di dalam CommunityGroup)
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: true;
    communityGroup: {
      include: { wallet: true } // <--- Syarat utama
    };
  };
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  // --- REUSABLE INCLUDE OBJECT ---
  // Biar tidak capek ngetik berulang-ulang dan konsisten
  private readonly userInclude = {
    role: true,
    communityGroup: {
      include: {
        wallet: true, // <--- INI KUNCINYA
      },
    },
  };

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude, // Pakai object include yang sudah lengkap
    });
  }

  async findById(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRelations> {
    return this.prisma.user.create({
      data,
      include: this.userInclude, // Create pun harus return wallet
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRelations> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: this.userInclude, // Update pun harus return wallet
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<[UserWithRelations[], number]> {
    const { skip, take, where, orderBy } = params;

    return this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        include: this.userInclude, // FindAll juga pakai ini
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  async softDelete(id: string): Promise<User> {
    // Soft delete biasanya tidak butuh return relasi lengkap, cukup User biasa
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // TAMBAHAN: Helper untuk validasi logic
  async count(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async findUserProfile(id: string): Promise<UserWithRelations | null> {
    // Saat ini logicnya sama dengan findById. 
    // Tapi jika nanti dashboard butuh data extra (misal: 5 transaksi terakhir),
    // kita cukup ubah 'include' di sini tanpa merusak fitur login lain.
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        communityGroup: {
          include: {
            wallet: true,
            duesRule: true, // Optional: User biasanya butuh tahu aturan iuran RT-nya
            parent: true,   // Optional: User butuh tahu RW-nya siapa
          },
        },
      },
    });
  }
  // Method lebih efisien untuk count single group
  async countByGroup(groupId: number): Promise<number> {
    return this.prisma.user.count({
      where: {
        communityGroupId: groupId,
        isActive: true,
      },
    });
  }

}