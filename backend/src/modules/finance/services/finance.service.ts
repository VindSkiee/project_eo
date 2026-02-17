import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { PrismaService } from '../../../database/prisma.service';
import { TransactionType } from '@prisma/client';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { CreateManualTransactionDto } from '../dto/create-manual-transaction.dto'; // Pastikan DTO ini ada

@Injectable()
export class FinanceService {
  constructor(
    private readonly financeRepo: FinanceRepository,
    private readonly prisma: PrismaService, // Dibutuhkan untuk memulai $transaction
  ) {}

  // ==========================================
  // 1. CEK INFORMASI DOMPET
  // ==========================================
  async getWalletDetails(communityGroupId: number) {
    const wallet = await this.financeRepo.findWalletByGroupId(communityGroupId);
    if (!wallet) throw new NotFoundException('Dompet digital belum diaktifkan untuk lingkungan ini');
    return wallet;
  }

  async getTransactionHistory(communityGroupId: number) {
    return this.financeRepo.findTransactions(communityGroupId);
  }

  // ==========================================
  // 2. TRANSAKSI MANUAL (Bendahara Input Kas Tunai/Belanja)
  // ==========================================
  async createManualTransaction(dto: CreateManualTransactionDto, user: ActiveUserData) {
    // Ambil info wallet
    const wallet = await this.getWalletDetails(user.communityGroupId);

    // Validasi Saldo (Hanya jika uang keluar/DEBIT)
    if (dto.type === TransactionType.DEBIT && Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Saldo kas tidak mencukupi untuk transaksi ini');
    }

    // Eksekusi Atomic Transaction
    return this.prisma.$transaction(async (tx) => {
      // A. Update Saldo
      await this.financeRepo.updateWalletBalance(tx, wallet.id, dto.amount, dto.type);

      // B. Catat Log
      return this.financeRepo.createTransactionRecord(tx, {
        walletId: wallet.id,
        amount: dto.amount,
        type: dto.type,
        description: `[MANUAL] ${dto.description}`,
        createdById: user.sub, // Track siapa bendaharanya
      });
    });
  }

  // ==========================================
  // 3. SYSTEM DEPOSIT (Untuk Split Bill Iuran / Midtrans)
  // ==========================================
  // Fungsi ini dipanggil oleh DuesService/PaymentService saat ada uang masuk otomatis
  async processSystemDeposit(communityGroupId: number, amount: number, description: string) {
    const wallet = await this.financeRepo.findWalletByGroupId(communityGroupId);
    if (!wallet) return; // Silent fail or log error

    await this.prisma.$transaction(async (tx) => {
      // A. Tambah Saldo (CREDIT)
      await this.financeRepo.updateWalletBalance(tx, wallet.id, amount, TransactionType.CREDIT);
      
      // B. Catat Log
      await this.financeRepo.createTransactionRecord(tx, {
        walletId: wallet.id,
        amount: amount,
        type: TransactionType.CREDIT,
        description: `[SYSTEM] ${description}`,
      });
    });
  }

  // ==========================================
  // 4. PENCAIRAN DANA EVENT (Integrasi Events Module)
  // ==========================================
  // Dipanggil saat Event statusnya menjadi FUNDED
  async disburseEventFund(communityGroupId: number, amount: number, eventId: string) {
    const wallet = await this.getWalletDetails(communityGroupId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Gagal mencairkan dana event: Saldo Kas tidak mencukupi.');
    }

    await this.prisma.$transaction(async (tx) => {
      // A. Kurangi Saldo (DEBIT)
      await this.financeRepo.updateWalletBalance(tx, wallet.id, amount, TransactionType.DEBIT);
      
      // B. Catat Log
      await this.financeRepo.createTransactionRecord(tx, {
        walletId: wallet.id,
        amount: amount,
        type: TransactionType.DEBIT,
        description: `Pencairan dana kegiatan operasional`,
        eventId: eventId
      });
    });
  }

  // ==========================================
  // 5. PENGEMBALIAN DANA EVENT (Refund/Settlement)
  // ==========================================
  // Dipanggil saat Event SETTLED (Sisa uang) atau CANCELLED (Full refund)
  async refundEventFund(communityGroupId: number, amount: number, eventId: string, reason: string) {
    const wallet = await this.getWalletDetails(communityGroupId);

    await this.prisma.$transaction(async (tx) => {
      // A. Tambah Saldo (CREDIT)
      await this.financeRepo.updateWalletBalance(tx, wallet.id, amount, TransactionType.CREDIT);
      
      // B. Catat Log
      await this.financeRepo.createTransactionRecord(tx, {
        walletId: wallet.id,
        amount: amount,
        type: TransactionType.CREDIT,
        description: `Pengembalian dana: ${reason}`,
        eventId: eventId
      });
    });
  }

  // ==========================================
  // 6. TRANSFER ANTAR GRUP (RT ke RW atau sebaliknya)
  // ==========================================
  // Dipanggil saat FundRequest disetujui
  async transferInterGroup(sourceGroupId: number, targetGroupId: number, amount: number, description: string) {
    const sourceWallet = await this.getWalletDetails(sourceGroupId);
    const targetWallet = await this.getWalletDetails(targetGroupId);

    if (Number(sourceWallet.balance) < amount) {
      throw new BadRequestException(`Gagal transfer: Saldo ${sourceWallet.communityGroup.name} tidak mencukupi.`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Potong saldo Pengirim (DEBIT)
      await this.financeRepo.updateWalletBalance(tx, sourceWallet.id, amount, TransactionType.DEBIT);
      await this.financeRepo.createTransactionRecord(tx, {
        walletId: sourceWallet.id,
        amount: amount,
        type: TransactionType.DEBIT,
        description: `Transfer Keluar ke ${targetWallet.communityGroup.name}: ${description}`,
      });

      // 2. Tambah saldo Penerima (CREDIT)
      await this.financeRepo.updateWalletBalance(tx, targetWallet.id, amount, TransactionType.CREDIT);
      await this.financeRepo.createTransactionRecord(tx, {
        walletId: targetWallet.id,
        amount: amount,
        type: TransactionType.CREDIT,
        description: `Transfer Masuk dari ${sourceWallet.communityGroup.name}: ${description}`,
      });
    });
  }

  // A. Ambil Saldo RT dan RW sekaligus
  async getTransparencyBalance(user: ActiveUserData) {
    // 1. Ambil info Group User (RT) dan Parent-nya (RW)
    const userGroup = await this.prisma.communityGroup.findUnique({
      where: { id: user.communityGroupId },
      include: { 
        wallet: true, // Dompet RT
        parent: {     // Group RW (Parent)
          include: { wallet: true } // Dompet RW
        } 
      }
    });

    if (!userGroup) throw new NotFoundException('Data lingkungan tidak ditemukan');

    // 2. Format Data untuk Frontend
    return {
      rt: {
        groupName: userGroup.name,
        balance: userGroup.wallet ? Number(userGroup.wallet.balance) : 0,
        lastUpdated: userGroup.wallet?.updatedAt || null
      },
      rw: userGroup.parent ? {
        groupName: userGroup.parent.name,
        balance: userGroup.parent.wallet ? Number(userGroup.parent.wallet.balance) : 0,
        lastUpdated: userGroup.parent.wallet?.updatedAt || null
      } : null // Jika tidak ada RW (misal user tinggal di komplek tanpa RW)
    };
  }

  // B. Ambil Riwayat Transaksi (Bisa pilih mau lihat RT atau RW)
  async getTransparencyHistory(user: ActiveUserData, scope: 'RT' | 'RW') {
    let targetGroupId = user.communityGroupId; // Default: RT

    // Jika user ingin melihat data RW, kita cari ID RW-nya
    if (scope === 'RW') {
      const userGroup = await this.prisma.communityGroup.findUnique({
        where: { id: user.communityGroupId },
        select: { parentId: true }
      });
      
      if (!userGroup?.parentId) {
        throw new BadRequestException('Lingkungan Anda tidak terdaftar dalam RW manapun');
      }
      targetGroupId = userGroup.parentId;
    }

    // Reuse fungsi yang sudah ada (aman & efisien)
    return this.financeRepo.findTransactions(targetGroupId);
  }
}