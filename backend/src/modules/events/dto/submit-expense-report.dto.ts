import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitExpenseReportDto {
  /**
   * JSON string dari array items: [{ title: string, amount: number }]
   * Dikirim sebagai string karena endpoint menerima multipart/form-data
   */
  @IsString()
  @IsNotEmpty({ message: 'Daftar item pengeluaran wajib diisi' })
  items!: string;

  /**
   * Sisa uang yang dikembalikan (dalam Rupiah)
   * Dikirim sebagai string karena multipart/form-data
   */
  @IsNotEmpty({ message: 'Sisa uang wajib diisi' })
  remainingAmount!: string | number;
}
