import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, User, PaymentGatewayStatus } from '@prisma/client'; // <-- Import PaymentGatewayStatus

// =========================================================================
// 1. SINGLE SOURCE OF TRUTH (Konfigurasi Include)
// =========================================================================
// Kita definisikan object include di sini dan menggunakan enum bawaan Prisma
// agar TypeScript tidak protes soal string "PAID" atau "desc".
const userIncludeOptions = {
  role: true,
  communityGroup: {
    include: {
      wallet: true,
      duesRule: true, // Ditambahkan agar frontend bisa baca aturan iuran
      parent: true,   // Ditambahkan agar frontend bisa tau RW-nya
    },
  },
  paymentGatewayTxs: { 
    where: { 
      status: PaymentGatewayStatus.PAID, // <-- Gunakan Enum Prisma
    },
    orderBy: { 
      createdAt: Prisma.SortOrder.desc,  // <-- Gunakan Enum Prisma
    }
  }
} satisfies Prisma.UserInclude;

// =========================================================================
// 2. DEFINISI TYPE OTOMATIS
// =========================================================================
// Tipe ini sekarang otomatis mengikuti struktur 'userIncludeOptions' di atas.
// Jika nanti Anda menambah/mengurangi tabel, tipe datanya akan otomatis update!
export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userIncludeOptions;
}>;


@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Gunakan konstanta yang sudah kita buat di atas
  private readonly userInclude = userIncludeOptions;

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
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
      include: this.userInclude,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRelations> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: this.userInclude,
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
        include: this.userInclude,
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async count(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  // UPDATE: Samakan include-nya dengan yang lain agar tidak error tipe data,
  // dan agar halaman frontend UserDetailPage mendapatkan data paymentGatewayTxs
  async findUserProfile(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude, 
    });
  }

  async countByGroup(groupId: number): Promise<number> {
    return this.prisma.user.count({
      where: {
        communityGroupId: groupId,
        isActive: true,
      },
    });
  }
}