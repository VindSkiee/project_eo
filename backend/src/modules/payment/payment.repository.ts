import { Injectable } from '@nestjs/common';
import { 
  // HAPUS PrismaClient dari sini
  PaymentGatewayStatus, 
  PaymentMethodCategory,
  Prisma
} from '@prisma/client';

// IMPORT PrismaService DARI FOLDER ANDA
import { PrismaService } from '../../database/prisma.service'; 

@Injectable()
export class PaymentRepository {
  // 👇 PERBAIKI DI SINI: Gunakan PrismaService, bukan PrismaClient
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. CREATE & INITIALIZE (Untuk createTransaction)
  // ==========================================
  async createTransaction(data: {
    orderId: string;
    userId: string;
    amount: number;
    grossAmount: number;
    methodCategory?: PaymentMethodCategory;
  }) {
    return this.prisma.paymentGatewayTx.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        grossAmount: data.grossAmount,
        status: PaymentGatewayStatus.PENDING,
        // Default category, akan di-update saat user memilih metode di popup Snap
        methodCategory: data.methodCategory || PaymentMethodCategory.VIRTUAL_ACCOUNT, 
      },
    });
  }

  async updateSnapData(orderId: string, snapToken: string, redirectUrl: string) {
    return this.prisma.paymentGatewayTx.update({
      where: { orderId },
      data: { snapToken, redirectUrl },
    });
  }

  // ==========================================
  // 2. READ / GET DATA (Untuk history, details, status)
  // ==========================================
  async findByOrderId(orderId: string) {
    return this.prisma.paymentGatewayTx.findUnique({
      where: { orderId },
      include: {
        user: { select: { fullName: true, email: true } } // Join data user
      }
    });
  }

  async findById(paymentId: string) {
    return this.prisma.paymentGatewayTx.findUnique({
      where: { id: paymentId },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.paymentGatewayTx.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Urutkan dari yang terbaru
    });
  }

  // 👇 METHOD BARU: Untuk Admin/Bendahara melihat semua transaksi
  async findAll() {
    return this.prisma.paymentGatewayTx.findMany({
      orderBy: { createdAt: 'desc' }, // Mengurutkan dari yang terbaru
      // Tambahkan include jika Anda butuh relasi data user
      // include: { user: { select: { fullName: true, email: true } } }
    });
  }

  // ==========================================
  // 3. UPDATE / ACTION (Untuk cancel, refund)
  // ==========================================
  async updateStatus(orderId: string, status: PaymentGatewayStatus) {
    return this.prisma.paymentGatewayTx.update({
      where: { orderId },
      data: { status },
    });
  }

  // ==========================================
  // 4. WEBHOOK / NOTIFICATION HANDLER
  // ==========================================
  /**
   * Fungsi ini dipanggil oleh endpoint /notification 
   * untuk mengupdate database berdasarkan callback dari Midtrans
   */
  async updateFromMidtransWebhook(
    orderId: string, 
    data: {
      status: PaymentGatewayStatus;
      midtransId?: string;
      methodCategory?: PaymentMethodCategory;
      providerCode?: string;
      vaNumber?: string;
      rawResponse?: Prisma.InputJsonValue;
      paidAt?: Date;
    }
  ) {
    return this.prisma.paymentGatewayTx.update({
      where: { orderId },
      data: {
        status: data.status,
        midtransId: data.midtransId,
        methodCategory: data.methodCategory,
        providerCode: data.providerCode,
        vaNumber: data.vaNumber,
        rawResponse: data.rawResponse,
        paidAt: data.paidAt,
      },
    });
  }
}