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
        createdBy: { select: { fullName: true } }, // Siapa bendaharanya
        // Jika ada relasi contribution, bisa di-include juga
      }
    });
  }
}