import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException, // <--- IMPORT BARU
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '../../database/prisma.service';
import * as midtransClient from 'midtrans-client';
import { PaymentGatewayStatus, PaymentMethodCategory, Prisma, SystemRoleType } from '@prisma/client';
import { ActiveUserData } from '@common/decorators/active-user.decorator'; // <--- IMPORT BARU
import { DuesService } from '@modules/finance/services/dues.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private snap: any;
  private coreApi: any;
  private readonly logger = new Logger(PaymentService.name);

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

    if (!isPengurus && paymentUserId !== user.id) {
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
  // ==========================================
  // GET HISTORY (IDOR PROTECTED 🛡️)
  // ==========================================
  async getPaymentHistory(requester: ActiveUserData, targetUserId?: string) {
    // 1. Tentukan siapa User yang datanya mau diambil (Subject)
    // Jika targetUserId kosong, berarti dia mau lihat data sendiri.
    const userIdToQuery = targetUserId || requester.id;

    // 2. CEK IDOR (Authorization Check)
    // Jika User yang Request BEDA dengan User yang Datanya Diambil...
    if (userIdToQuery !== requester.id) {
       
       // ...Maka yang Request WAJIB Admin/Bendahara/Ketua
       const allowedRoles: SystemRoleType[] = [
          SystemRoleType.ADMIN, 
          SystemRoleType.TREASURER, 
          SystemRoleType.LEADER
       ];

       if (!allowedRoles.includes(requester.roleType)) {
          throw new ForbiddenException('Anda tidak memiliki akses untuk melihat riwayat transaksi pengguna lain.');
       }

       // Opsional: Cek apakah Admin RT 01 mencoba melihat data warga RT 02? (Cross-Group IDOR)
       // (Memerlukan query ke DB untuk cek group userIdToQuery, bisa ditambahkan jika perlu)
    }

    // 3. Ambil Data
    return this.paymentRepo.findByUserId(userIdToQuery);
  }

  async getPaymentDetails(paymentId: string, user: ActiveUserData) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundException('Transaksi tidak ditemukan');

    // 👇 Cek akses: hanya admin atau pemilik transaksi yang boleh melihat detail
    this.checkAccess(payment.userId, user);

    return payment;
  }

  // 👇 UPDATE METHOD INI
  // Izinkan menerima parameter "params" dengan tipe dari Prisma
  async getAllTransactions(params?: Prisma.PaymentGatewayTxFindManyArgs) {
    return this.prisma.paymentGatewayTx.findMany(params);
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
  // 6. WEBHOOK HANDLER (PRODUCTION READY 🛡️)
  // ==========================================
  async handleNotification(notificationBody: any) {
    // ---------------------------------------------------------
    // STEP 1: VALIDASI INPUT & SECURITY CHECK (Di luar Transaksi)
    // ---------------------------------------------------------
    if (!notificationBody || typeof notificationBody !== 'object') {
      throw new BadRequestException('Invalid webhook payload');
    }

    const serverKey = this.configService.get<string>('midtrans.serverKey');
    if (!serverKey) throw new InternalServerErrorException('Midtrans Server Key is missing');

    const { order_id, status_code, gross_amount, signature_key } = notificationBody;

    if (!signature_key || !order_id || !status_code || !gross_amount) {
      throw new ForbiddenException('Incomplete webhook payload');
    }

    // ✅ NORMALISASI: Pastikan format gross_amount konsisten
    // Midtrans mengirim dalam format "XXXXX.00"
    const normalizedAmount = parseFloat(gross_amount).toFixed(2);

    const payloadString = order_id + status_code + normalizedAmount + serverKey;

    const expectedSignature = crypto
      .createHash('sha512')
      .update(payloadString)
      .digest('hex');

    // 1.B. Timing-Safe Comparison (Mencegah Timing Attack)
    const signatureBuffer = Buffer.from(signature_key);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error(`⛔ [SECURITY ALERT] Fake Webhook detected for Order ${order_id}`);
      throw new ForbiddenException('Invalid Signature Key');
    }

    // ---------------------------------------------------------
    // STEP 2: PERSIAPAN DATA
    // ---------------------------------------------------------
    const transactionStatus = notificationBody.transaction_status;
    const fraudStatus = notificationBody.fraud_status;
    const paymentType = notificationBody.payment_type;

    let finalStatus: PaymentGatewayStatus = PaymentGatewayStatus.PENDING;

    // Mapping Status Midtrans ke Enum Kita
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
    } else if (transactionStatus === 'pending') {
      finalStatus = PaymentGatewayStatus.PENDING;
    }

    // Mapping Kategori Pembayaran
    let category: PaymentMethodCategory = PaymentMethodCategory.VIRTUAL_ACCOUNT;
    if (['gopay', 'shopeepay', 'qris'].includes(paymentType)) category = PaymentMethodCategory.E_WALLET;
    else if (paymentType === 'credit_card') category = PaymentMethodCategory.CREDIT_CARD;
    else if (paymentType === 'cstore') category = PaymentMethodCategory.CONVENIENCE_STORE;

    let providerCode = paymentType;
    let vaNumber = undefined;

    // Ambil info VA jika ada
    if (notificationBody.va_numbers?.[0]) {
      providerCode = notificationBody.va_numbers[0].bank;
      vaNumber = notificationBody.va_numbers[0].va_number;
    } else if (notificationBody.bca_va_number) {
      providerCode = 'bca';
      vaNumber = notificationBody.bca_va_number;
    }

    // ---------------------------------------------------------
    // STEP 3: DATABASE TRANSACTION (ATOMIC OPERATION)
    // ---------------------------------------------------------
    // Kita membungkus Cek Status, Update Status, dan Distribusi Uang dalam 1 Transaksi.
    // IsolationLevel.Serializable = Level tertinggi, memastikan data dikunci (Lock) saat diproses.

    return await this.prisma.$transaction(async (tx) => {
      // 3.A. Cari Transaksi di Database
      // Menggunakan tx (Transaction Client) bukan this.prisma
      const existingTransaction = await tx.paymentGatewayTx.findUnique({
        where: { orderId: order_id },
      });

      if (!existingTransaction) {
        console.warn(`⚠️ Transaction ${order_id} not found in DB during webhook.`);
        return { status: 'ok', message: 'Transaction ignored (Not found)' };
      }

      // 3.B. Idempotency Check (Pencegahan Double Process)
      // Jika status di DB sudah PAID, abaikan request ini.
      if (existingTransaction.status === PaymentGatewayStatus.PAID) {
        console.log(`ℹ️ Order ${order_id} is already PAID. Ignoring duplicate webhook.`);
        return { status: 'ok', message: 'Already processed' };
      }

      // 3.C. Update Payment Status
      const updatedPayment = await tx.paymentGatewayTx.update({
        where: { orderId: order_id },
        data: {
          status: finalStatus,
          midtransId: notificationBody.transaction_id,
          methodCategory: category,
          providerCode: providerCode,
          vaNumber: vaNumber,
          rawResponse: notificationBody, // Simpan mentahan JSON buat debug
          paidAt: finalStatus === PaymentGatewayStatus.PAID ? new Date() : null,
        },
      });

      // 3.D. Trigger Distribusi Uang (Hanya jika status berubah jadi PAID)
      if (finalStatus === PaymentGatewayStatus.PAID) {
        console.log(`💰 Payment Success for ${order_id}. Distributing funds atomically...`);

        // PENTING: Kita harus mengoper 'tx' ke service lain
        // Agar DuesService ikut dalam transaksi yang sama.
        await this.duesService.distributeContribution(
          updatedPayment.userId,
          Number(updatedPayment.amount),
          tx // 👈 PASS TRANSACTION CLIENT KE SINI
        );
      }

      this.logger.log(`✅ Webhook Processed: ${order_id} -> ${finalStatus}`);
       return { status: 'ok', message: 'Webhook processed' };
    }, {
       isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
       timeout: 20000,
    });
  }

  // ==========================================
  // CREATE PAYMENT TOKEN (Bayar Iuran)
  // ==========================================
  async createDuesPayment(user: ActiveUserData) {
    // 0. CEK DUPLIKAT: Jangan buat transaksi baru jika masih ada PENDING
    const existingPending = await this.prisma.paymentGatewayTx.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        orderId: { startsWith: 'DUES-' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending) {
      // Jika ada transaksi PENDING yang masih punya token, kembalikan token yang sama
      if (existingPending.snapToken && existingPending.redirectUrl) {
        return {
          token: existingPending.snapToken,
          redirect_url: existingPending.redirectUrl,
          amount: Number(existingPending.amount),
          breakdown: [], // Breakdown tidak disimpan, tapi client sudah punya dari getMyBill
        };
      }
      // Jika PENDING tanpa token (edge case), batalkan dulu sebelum buat baru
      await this.prisma.paymentGatewayTx.update({
        where: { id: existingPending.id },
        data: { status: 'CANCELLED' },
      });
    }

    // 1. HITUNG TAGIHAN
    const bill = await this.duesService.getMyBill(user);

    if (bill.totalAmount <= 0) {
      throw new BadRequestException('Tidak ada tagihan iuran yang perlu dibayar saat ini.');
    }

    // 2. GENERATE ORDER ID
    const orderId = `DUES-${user.id}-${Date.now()}`;

    // 3. 👇 TAMBAHAN PENTING: SIMPAN DRAFT KE DB DULU!
    // Kita pakai repo yang sama seperti createTransaction
    await this.paymentRepo.createTransaction({
      orderId: orderId,
      userId: user.id,
      amount: bill.totalAmount,
      grossAmount: bill.totalAmount,
      // Bisa tambah field metadata/description kalau perlu
    });

    // 4. SIAPKAN PARAMETER MIDTRANS
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: bill.totalAmount,
      },
      item_details: bill.breakdown.map((item) => ({
        id: `ITEM-${item.type}`,
        price: item.amount,
        quantity: 1,
        name: item.groupName,
      })),
      customer_details: {
        first_name: user.email,
        email: user.email,
      },
      custom_field1: user.id,
    };

    // 5. MINTA TOKEN
    try {
      const transaction = await this.snap.createTransaction(parameter);

      // 6. 👇 UPDATE TOKEN KE DB (Agar sinkron)
      await this.paymentRepo.updateSnapData(orderId, transaction.token, transaction.redirect_url);

      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        amount: bill.totalAmount,
        breakdown: bill.breakdown
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Gagal membuat transaksi pembayaran: ' + errorMessage);
    }
  }
}