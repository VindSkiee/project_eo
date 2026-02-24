import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TransactionType, Prisma } from '@prisma/client';

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. GET WALLET (Cek Saldo)
  // ==========================================
  async findWalletByGroupId(communityGroupId: number) {
    return this.prisma.wallet.findUnique({
      where: { communityGroupId },
      include: { 
        communityGroup: { select: { name: true, type: true } } 
      }
    });
  }

  // ==========================================
  // 2. MUTASI SALDO (Atomic Increment/Decrement)
  // ==========================================
  // Menerima 'tx' (Transaction Client) agar bisa digabung dalam transaksi besar
  async updateWalletBalance(
    tx: Prisma.TransactionClient, 
    walletId: number, 
    amount: number, 
    type: TransactionType
  ) {
    if (type === TransactionType.CREDIT) {
      // Uang Masuk: Tambah Saldo
      return tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } }
      });
    } else {
      // Uang Keluar: Kurangi Saldo
      return tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } }
      });
    }
  }

  // ==========================================
  // 3. CATAT RIWAYAT TRANSAKSI (Log)
  // ==========================================
  async createTransactionRecord(
    tx: Prisma.TransactionClient,
    data: {
      walletId: number;
      amount: number;
      type: TransactionType;
      description: string;
      contributionId?: string; // Jika dari iuran warga
      eventId?: string;        // Jika terkait event
      createdById?: string;    // Siapa yang melakukan (jika manual)
    }
  ) {
    return tx.transaction.create({
      data: {
        walletId: data.walletId,
        amount: data.amount, // Pastikan amount selalu positif di DB
        type: data.type,
        description: data.description,
        contributionId: data.contributionId,
        eventId: data.eventId,
        createdById: data.createdById
      }
    });
  }

  // ==========================================
  // 4. AMBIL HISTORY (Laporan Keuangan)
  // ==========================================
  async findTransactions(communityGroupId: number) {
    return this.prisma.transaction.findMany({
      where: {
        wallet: { communityGroupId }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { title: true } },
        createdBy: { select: { fullName: true } }, // Pembuat manual (Bendahara)
        
        // OPSIONAL TAPI SANGAT DIANJURKAN JIKA ADA RELASI KE CONTRIBUTION:
        // Agar history menampilkan "Iuran Bulan X - Budi"
        contribution: { 
          select: { 
            month: true, 
            year: true, 
            user: { select: { fullName: true } } 
          } 
        }
      }
    });
  }

  // ==========================================
  // 5. CHILDREN WALLETS (Saldo semua RT di bawah RW)
  // ==========================================
  async findChildrenWallets(rwGroupId: number) {
    return this.prisma.communityGroup.findUnique({
      where: { id: rwGroupId },
      include: {
        wallet: true,
        children: {
          orderBy: { name: 'asc' },
          include: {
            wallet: true,
            duesRule: true,
            users: {
              where: {
                role: { type: { in: ['ADMIN', 'TREASURER'] } },
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
      },
    });
  }

  // ==========================================
  // 6. GROUP FINANCE DETAIL (Detail keuangan 1 RT)
  // ==========================================
  async findGroupFinanceDetail(groupId: number) {
    return this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        wallet: true,
        duesRule: true,
        parent: { select: { id: true, name: true, type: true } },
        users: {
          where: {
            role: { type: { in: ['ADMIN', 'TREASURER'] } },
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
    });
  }

  // ==========================================
  // 7. SINGLE TRANSACTION DETAIL
  // ==========================================
  async findTransactionById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            communityGroup: { select: { id: true, name: true, type: true } },
          },
        },
        event: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        contribution: {
          select: {
            id: true,
            month: true,
            year: true,
            amount: true,
            paidAt: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });
  }

  // ==========================================
  // 8. PARENT DUES PROGRESS (RW View)
  // ==========================================
  async findParentWithChildrenProgress(rwGroupId: number, targetYear: number) {
    return this.prisma.communityGroup.findUnique({
      where: { id: rwGroupId },
      select: {
        id: true,
        name: true,
        type: true,
        children: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            wallet: { select: { balance: true } },
            // Ambil semua user aktif beserta role dan history iurannya
            users: {
              where: { isActive: true },
              select: {
                id: true,
                fullName: true,
                createdAt: true,
                lastPaidPeriod: true,
                role: { select: { type: true } },
                contributions: {
                  where: { year: targetYear },
                  select: { month: true, year: true }
                }
              }
            }
          }
        }
      }
    });
  }
}