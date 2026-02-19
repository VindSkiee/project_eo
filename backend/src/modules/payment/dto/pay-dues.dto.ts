import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PayDuesDto {
  /**
   * Jumlah bulan yang ingin dibayar sekaligus.
   * Minimum 1 (bulan berjalan), maksimum 12 (bayar di muka setahun penuh).
   * Wajib integer positif; diabaikan saat ada pending transaksi (token lama dikembalikan).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'months harus berupa bilangan bulat' })
  @Min(1, { message: 'Minimal 1 bulan' })
  @Max(12, { message: 'Maksimal 12 bulan sekaligus' })
  months: number = 1;
}
