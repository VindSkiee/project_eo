import { Injectable, NotFoundException } from '@nestjs/common';
import { DuesRepository } from '../repositories/dues.repository'; // <-- Pakai Repo
import { FinanceService } from './finance.service';
import { PrismaService } from '@database/prisma.service';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { SetDuesDto } from '../dto/set-dues.dto';
import { Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class DuesService {
  constructor(
    private readonly duesRepo: DuesRepository,
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService
  ) {}

  // ==========================================
  // 1. SETTING IURAN
  // ==========================================
  async setDuesRule(dto: SetDuesDto, user: ActiveUserData) {
    return this.duesRepo.upsertDuesRule(user.communityGroupId, dto);
  }

  // ==========================================
  // 1b. GET DUES CONFIG (Untuk Halaman Pengaturan)
  // ==========================================
  async getDuesConfig(user: ActiveUserData) {
    const group = await this.duesRepo.findDuesConfigByGroupId(user.communityGroupId);
    if (!group) {
      throw new NotFoundException('Data lingkungan tidak ditemukan');
    }

    return {
      group: {
        id: group.id,
        name: group.name,
        type: group.type,
      },
      duesRule: group.duesRule
        ? {
            id: group.duesRule.id,
            amount: Number(group.duesRule.amount),
            dueDay: group.duesRule.dueDay,
            isActive: group.duesRule.isActive,
            updatedAt: group.duesRule.updatedAt,
          }
        : null,
      children: group.children.map((child) => ({
        group: {
          id: child.id,
          name: child.name,
          type: child.type,
        },
        duesRule: child.duesRule
          ? {
              id: child.duesRule.id,
              amount: Number(child.duesRule.amount),
              dueDay: child.duesRule.dueDay,
              isActive: child.duesRule.isActive,
              updatedAt: child.duesRule.updatedAt,
            }
          : null,
      })),
    };
  }

  // ==========================================
  // 2. LIHAT TAGIHAN (Split Bill Calculation)
  // ==========================================
  async getMyBill(user: ActiveUserData) {
    // Ambil data hierarki dari Repo
    const groupData = await this.duesRepo.findGroupHierarchyWithRules(user.communityGroupId);

    if (!groupData) throw new NotFoundException('Data lingkungan tidak ditemukan');

    const breakdown: Array<{ type: string; groupName: string; amount: number; destinationWalletId: number }> = [];
    let totalAmount = 0;

    // A. Hitung Jatah RT
    if (groupData.duesRule && groupData.duesRule.isActive) {
      const rtAmount = Number(groupData.duesRule.amount);
      totalAmount += rtAmount;
      breakdown.push({
        type: 'RT',
        groupName: groupData.name,
        amount: rtAmount,
        destinationWalletId: groupData.id 
      });
    }

    // B. Hitung Jatah RW (Jika ada Parent)
    if (groupData.parent && groupData.parent.duesRule && groupData.parent.duesRule.isActive) {
      const rwAmount = Number(groupData.parent.duesRule.amount);
      totalAmount += rwAmount;
      breakdown.push({
        type: 'RW',
        groupName: groupData.parent.name,
        amount: rwAmount,
        destinationWalletId: groupData.parent.id
      });
    }

    return {
      totalAmount,
      currency: 'IDR',
      breakdown,
      dueDateDescription: `Setiap tanggal ${groupData.duesRule?.dueDay || 10} bulan berjalan`
    };
  }

  // ==========================================
  // 3. DISTRIBUSI UANG (Dipanggil Payment Service)
  // ==========================================
  // Logic: User bayar 30rb -> 15rb masuk RT, 15rb masuk RW
  // ==========================================
  // 3. UPDATE STATUS SETELAH BAYAR (Atomic)
  // ==========================================
  async distributeContribution(
    userId: string,
    totalPaid: number,
    tx?: Prisma.TransactionClient // 👈 Parameter Transaksi Opsional
  ) {
    // Gunakan Transaction Client jika ada, jika tidak pakai default Prisma Service
    const prismaClient = tx || this.prisma;

    // 1. AMBIL DATA USER & RULE (Read)
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        communityGroup: {
          include: {
            wallet: true, // Ambil Wallet RT
            duesRule: true,
            parent: {
              include: {
                wallet: true, // Ambil Wallet RW
                duesRule: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.communityGroup) {
      console.warn(`[DuesService] User ${userId} tidak memiliki grup komunitas.`);
      return;
    }

    const group = user.communityGroup;
    const parent = group.parent;

    // 2. HITUNG ALOKASI DANA
    // Berapa jatah RT dan RW per bulan?
    const rtRate = group.duesRule?.isActive ? Number(group.duesRule.amount) : 0;
    const rwRate = (parent && parent.duesRule?.isActive) ? Number(parent.duesRule.amount) : 0;
    const monthlyTotal = rtRate + rwRate;

    // Berapa bulan yang dibayar? (Pembulatan ke bawah untuk safety)
    const monthsPaid = monthlyTotal > 0 ? Math.floor(totalPaid / monthlyTotal) : 0;
    
    // Hitung total nominal uang yang akan masuk ke masing-masing kas
    const totalToRT = rtRate * monthsPaid;
    const totalToRW = rwRate * monthsPaid;

    // Sisa uang (kembalian/kelebihan) dianggap donasi ke RT (atau bisa diset logic lain)
    const donationToRT = totalPaid - (totalToRT + totalToRW);
    const finalToRT = totalToRT + donationToRT;

    console.log(`[DuesService] Distributing: RT=${finalToRT}, RW=${totalToRW}, Months=${monthsPaid}`);

    // 3. EKSEKUSI UPDATE SALDO RT (Write)
    if (finalToRT > 0 && group.wallet) {
      await prismaClient.wallet.update({
        where: { id: group.wallet.id },
        data: { balance: { increment: finalToRT } }
      });

      // Catat Log Transaksi RT
      await prismaClient.transaction.create({
        data: {
          walletId: group.wallet.id,
          amount: finalToRT,
          type: TransactionType.CREDIT,
          description: `Iuran Warga: ${user.fullName || user.email} (${monthsPaid} bulan)`,
          createdById: user.id, // Opsional: Siapa yang bayar
        }
      });
    }

    // 4. EKSEKUSI UPDATE SALDO RW (Write)
    if (totalToRW > 0 && parent && parent.wallet) {
      await prismaClient.wallet.update({
        where: { id: parent.wallet.id },
        data: { balance: { increment: totalToRW } }
      });

      // Catat Log Transaksi RW
      await prismaClient.transaction.create({
        data: {
          walletId: parent.wallet.id,
          amount: totalToRW,
          type: TransactionType.CREDIT,
          description: `Setoran Iuran dari RT ${group.name} - Warga: ${user.fullName || user.email}`,
          createdById: user.id,
        }
      });
    }

    // 5. UPDATE PERIODE PEMBAYARAN USER (Write)
    if (monthsPaid > 0) {
      // Tentukan start date: Jika null, mulai dari createdAt. Jika ada, mulai dari lastPaidPeriod.
      let newPaidPeriod = user.lastPaidPeriod 
        ? new Date(user.lastPaidPeriod) 
        : new Date(user.createdAt);

      // Tambahkan jumlah bulan yang dibayar
      newPaidPeriod.setMonth(newPaidPeriod.getMonth() + monthsPaid);

      await prismaClient.user.update({
        where: { id: user.id },
        data: { lastPaidPeriod: newPaidPeriod }
      });
    }
  }
}