import { Injectable, NotFoundException } from '@nestjs/common';
import { DuesRepository } from '../repositories/dues.repository'; // <-- Pakai Repo
import { FinanceService } from './finance.service';
import { ActiveUserData } from '@common/decorators/active-user.decorator';
import { SetDuesDto } from '../dto/set-dues.dto';

@Injectable()
export class DuesService {
  constructor(
    private readonly duesRepo: DuesRepository,
    private readonly financeService: FinanceService,
  ) {}

  // ==========================================
  // 1. SETTING IURAN
  // ==========================================
  async setDuesRule(dto: SetDuesDto, user: ActiveUserData) {
    return this.duesRepo.upsertDuesRule(user.communityGroupId, dto);
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
  async distributeContribution(userId: string, totalPaid: number) {
    // 1. Cari user beserta aturan RT & RW-nya
    const user = await this.duesRepo.findUserWithGroup(userId);
    if (!user) return; // Atau throw error

    const group = user.communityGroup;
    const parent = group.parent;

    // 2. Tentukan nominal masing-masing
    const rtAmount = group.duesRule?.isActive ? Number(group.duesRule.amount) : 0;
    const rwAmount = (parent && parent.duesRule?.isActive) ? Number(parent.duesRule.amount) : 0;

    // 3. Eksekusi Masuk Uang ke Wallet RT
    if (rtAmount > 0) {
      await this.financeService.processSystemDeposit(
        group.id,
        rtAmount,
        `Iuran Warga: ${user.fullName} (Jatah RT)`
      );
    }

    // 4. Eksekusi Masuk Uang ke Wallet RW
    if (rwAmount > 0 && parent) {
      await this.financeService.processSystemDeposit(
        parent.id,
        rwAmount,
        `Iuran Warga: ${user.fullName} (Jatah RW dari RT ${group.name})`
      );
    }
    
    // TODO: Jika totalPaid > (rtAmount + rwAmount), sisa uangnya mau dikemanakan?
    // Biasanya dimasukkan ke saldo deposit user atau dianggap donasi ke RT.
  }
}