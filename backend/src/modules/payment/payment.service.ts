import { 
  Injectable, 
  InternalServerErrorException, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException // <--- IMPORT BARU
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '../../database/prisma.service'; 
import * as midtransClient from 'midtrans-client';
import { PaymentGatewayStatus, PaymentMethodCategory, SystemRoleType } from '@prisma/client';
import { ActiveUserData } from '@common/decorators/active-user.decorator'; // <--- IMPORT BARU
import { DuesService } from '@modules/finance/services/dues.service';

@Injectable()
export class PaymentService {
  private snap: any;
  private coreApi: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentRepo: PaymentRepository,
    private readonly duesService: DuesService,
    private readonly prisma: PrismaService, // INJECT PRISMA DI SINI
  ) {
    const isProduction = this.configService.get<boolean>('midtrans.isProduction', false);
    const serverKey = this.configService.get<string>('midtrans.serverKey', '');
    const clientKey = this.configService.get<string>('midtrans.clientKey', '');

    this.snap = new midtransClient.Snap({ isProduction, serverKey, clientKey });
    this.coreApi = new midtransClient.CoreApi({ isProduction, serverKey, clientKey });
  }

  // 👇 FUNGSI PEMBANTU UNTUK CEK AKSES (MENCEGAH IDOR)
  private checkAccess(paymentUserId: string, user: ActiveUserData) {
    // Definisikan tipe array-nya secara eksplisit
    const pengurusRoles: SystemRoleType[] = [
      SystemRoleType.ADMIN, 
      SystemRoleType.TREASURER, 
      SystemRoleType.LEADER
    ];

    const isPengurus = pengurusRoles.includes(user.roleType);

    if (!isPengurus && paymentUserId !== user.sub) {
      throw new ForbiddenException('Anda tidak memiliki akses ke transaksi ini');
    }
  }

  // ==========================================
  // 1. CREATE TRANSACTION (Snap)
  // ==========================================
  // Perhatikan: Kita hanya menerima userId, amount, dan orderId. 
  // Tidak perlu pakai DTO di sini.
  async createTransaction(userId: string, orderId: string, amount: number) {
    // 1. Ambil data user dari Database untuk detail Midtrans
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, phone: true } // Ambil yang perlu saja
    });

    if (!user) throw new NotFoundException('Data user tidak ditemukan');

    try {
      // 2. Simpan "Draft" ke Database (Status: PENDING)
      await this.paymentRepo.createTransaction({
        orderId,
        userId,
        amount,
        grossAmount: amount, // Asumsi belum ada admin fee
      });

      // 3. Siapkan parameter Midtrans Snap dengan data ASLI dari DB
      const params = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: user.fullName || 'Member',
          email: user.email,
          phone: user.phone || '08000000000', // Gunakan phone dari DB, atau fallback
        },
      };

      // 4. Tembak ke Midtrans
      const transaction = await this.snap.createTransaction(params);

      // 5. Update Token ke Database
      await this.paymentRepo.updateSnapData(orderId, transaction.token, transaction.redirect_url);

      return {
        success: true,
        orderId,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
      };
    } catch (error) {
      console.error('Midtrans Create Error:', error);
      throw new InternalServerErrorException('Gagal membuat transaksi pembayaran');
    }
  }

  // ==========================================
  // 2. GET TRANSACTION STATUS (Mencegah IDOR)
  // ==========================================
  async getTransactionStatus(orderId: string, user: ActiveUserData) {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new NotFoundException('Transaksi tidak ditemukan');

    // 👇 Cek akses: hanya admin atau pemilik transaksi yang boleh melihat
    this.checkAccess(payment.userId, user);

    try {
      const midtransStatus = await this.coreApi.transaction.status(orderId);
      return { dbStatus: payment, midtransStatus };
    } catch (error) {
      return { dbStatus: payment, midtransStatus: null };
    }
  }

  // ==========================================
  // 3. CANCEL TRANSACTION (Mencegah IDOR)
  // ==========================================
  async cancelTransaction(orderId: string, user: ActiveUserData) {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new NotFoundException('Transaksi tidak ditemukan');

    // 👇 Cek akses: hanya admin atau pemilik transaksi yang boleh membatalkan
    this.checkAccess(payment.userId, user);

    try {
      await this.coreApi.transaction.cancel(orderId);
      // Asumsi Anda punya method updateStatus di repository
      // await this.paymentRepo.updateStatus(orderId, PaymentGatewayStatus.CANCELLED);
      return { success: true, message: 'Transaksi berhasil dibatalkan' };
    } catch (error) {
      throw new BadRequestException('Gagal membatalkan transaksi di Midtrans. Mungkin sudah terbayar atau expired.');
    }
  }

  // ==========================================
  // 4. GET HISTORY & DETAILS (Mencegah IDOR)
  // ==========================================
  async getPaymentHistory(userId: string) {
    return this.paymentRepo.findByUserId(userId);
  }

  async getPaymentDetails(paymentId: string, user: ActiveUserData) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundException('Transaksi tidak ditemukan');

    // 👇 Cek akses: hanya admin atau pemilik transaksi yang boleh melihat detail
    this.checkAccess(payment.userId, user);

    return payment;
  }

  // 👇 METHOD BARU: Untuk Admin/Bendahara melihat semua transaksi
  async getAllTransactions() {
    return this.paymentRepo.findAll();
  }

  // ==========================================
  // 5. REFUND LOGIC
  // ==========================================
  async requestRefund(paymentId: string, amount: number, reason: string, userId: string) {
     const payment = await this.paymentRepo.findById(paymentId);
     if (!payment) throw new NotFoundException('Transaksi tidak ditemukan');
     
     // Pastikan hanya pemilik yang bisa request refund
     if (payment.userId !== userId) {
         throw new ForbiddenException('Anda tidak berhak mengajukan refund untuk transaksi ini');
     }

    return { message: 'Request refund diajukan', paymentId, amount, reason, requestedBy: userId };
  }

  async processRefund(refundId: string) {
    return { message: 'Refund diproses (Simulasi)' };
  }

  // ==========================================
  // 6. WEBHOOK HANDLER (CRUCIAL!)
  // ==========================================
  // Gunakan Record<string, any> sebagai pengganti 'any' agar lebih type-safe
  async handleNotification(notificationBody: Record<string, any>) {
    try {
      const statusResponse = await this.coreApi.transaction.notification(notificationBody);

      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;
      const paymentType = statusResponse.payment_type;

      let finalStatus: PaymentGatewayStatus = PaymentGatewayStatus.PENDING;

      if (transactionStatus === 'capture') {
        finalStatus = fraudStatus === 'challenge' ? PaymentGatewayStatus.PENDING : PaymentGatewayStatus.PAID;
      } else if (transactionStatus === 'settlement') {
        finalStatus = PaymentGatewayStatus.PAID;
      } else if (transactionStatus === 'cancel') {
        finalStatus = PaymentGatewayStatus.CANCELLED;
      } else if (transactionStatus === 'deny' || transactionStatus === 'failure') {
        finalStatus = PaymentGatewayStatus.FAILED;
      } else if (transactionStatus === 'expire') {
        finalStatus = PaymentGatewayStatus.EXPIRED;
      }

      let category: PaymentMethodCategory = PaymentMethodCategory.VIRTUAL_ACCOUNT;

      if (paymentType === 'gopay' || paymentType === 'shopeepay' || paymentType === 'qris') {
        category = PaymentMethodCategory.E_WALLET;
        if (paymentType === 'qris') category = PaymentMethodCategory.QRIS;
      } else if (paymentType === 'credit_card') {
        category = PaymentMethodCategory.CREDIT_CARD;
      } else if (paymentType === 'cstore') {
        category = PaymentMethodCategory.CONVENIENCE_STORE;
      }

      let providerCode = paymentType;
      let vaNumber = undefined;

      if (statusResponse.va_numbers && statusResponse.va_numbers.length > 0) {
        providerCode = statusResponse.va_numbers[0].bank;
        vaNumber = statusResponse.va_numbers[0].va_number;
      } else if (statusResponse.bca_va_number) {
        providerCode = 'bca';
        vaNumber = statusResponse.bca_va_number;
      }

      await this.paymentRepo.updateFromMidtransWebhook(orderId, {
        status: finalStatus,
        midtransId: statusResponse.transaction_id,
        methodCategory: category,
        providerCode: providerCode,
        vaNumber: vaNumber,
        rawResponse: statusResponse,
        paidAt: finalStatus === PaymentGatewayStatus.PAID ? new Date(statusResponse.settlement_time || Date.now()) : undefined,
      });

      console.log(`✅ Webhook Processed: Order ${orderId} is now ${finalStatus}`);
      return { status: 'ok', message: 'Webhook successfully processed' };

    } catch (error) {
      console.error('Webhook Verification Error:', error);
      throw new BadRequestException('Invalid notification data');
    }
  }

  // ==========================================
  // CREATE PAYMENT TOKEN (Bayar Iuran)
  // ==========================================
  async createDuesPayment(user: ActiveUserData) {
    // 1. HITUNG TAGIHAN OTOMATIS
    // Panggil fungsi yang sudah kita buat kemarin
    const bill = await this.duesService.getMyBill(user);

    // Validasi: Kalau total 0, ngapain bayar?
    if (bill.totalAmount <= 0) {
      throw new BadRequestException('Tidak ada tagihan iuran yang perlu dibayar saat ini.');
    }

    // 2. BUAT ORDER ID UNIK
    // Format: DUES-{USER_ID}-{TIMESTAMP} agar tidak duplikat
    const orderId = `DUES-${user.sub}-${Date.now()}`;

    // 3. SIAPKAN PAYLOAD KE MIDTRANS
    // Di sinilah kita "memaksa" Midtrans memakai harga hitungan kita
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: bill.totalAmount, // <--- INI KUNCINYA (30.000)
      },
      // Fitur Keren: Rincian Item (Warga bisa lihat di email invoice Midtrans)
      item_details: bill.breakdown.map((item) => ({
        id: `ITEM-${item.type}`,    // misal: ITEM-RT
        price: item.amount,         // misal: 15000
        quantity: 1,
        name: item.groupName,       // misal: "Iuran RT 01"
      })),
      customer_details: {
        first_name: user.email, // Atau nama user
        email: user.email,
      },
      // Custom field untuk menyimpan User ID agar mudah saat Webhook nanti
      custom_field1: user.sub, 
    };

    // 4. MINTA TOKEN KE MIDTRANS
    try {
      const transaction = await this.snap.createTransaction(parameter);
      
      // Kembalikan token dan url redirect ke Frontend
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        amount: bill.totalAmount, // Info tambahan buat frontend
        breakdown: bill.breakdown
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Gagal membuat transaksi pembayaran: ' + errorMessage);
    }
  }
}