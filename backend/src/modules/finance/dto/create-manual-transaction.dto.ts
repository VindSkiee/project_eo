import { 
  IsEnum, 
  IsNumber, 
  IsString, 
  IsNotEmpty, 
  Min, 
  IsOptional, 
  IsUUID 
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateManualTransactionDto {
  // 1. Tipe Transaksi: Hanya boleh CREDIT (Uang Masuk) atau DEBIT (Uang Keluar)
  @IsEnum(TransactionType, { 
    message: 'Tipe transaksi harus berupa CREDIT (Pemasukan) atau DEBIT (Pengeluaran)' 
  })
  type!: TransactionType;

  // 2. Nominal: Harus angka positif dan minimal 1.000 rupiah
  @IsNumber({}, { message: 'Nominal harus berupa angka' })
  @Min(1000, { message: 'Nominal transaksi minimal Rp 1.000' })
  amount!: number;

  // 3. Keterangan: Wajib diisi agar audit jelas (misal: "Beli ATK", "Sumbangan Hamba Allah")
  @IsString()
  @IsNotEmpty({ message: 'Keterangan transaksi wajib diisi untuk keperluan audit' })
  description!: string;

  // 4. (Opsional) Kontributor: Jika ini sumbangan tunai dari warga tertentu
  // Bendahara bisa memilih nama warga dari dropdown di frontend
  @IsOptional()
  @IsUUID('4', { message: 'ID Kontributor tidak valid' })
  contributorUserId?: string;
}