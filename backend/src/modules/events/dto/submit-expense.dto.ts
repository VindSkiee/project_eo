import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  Min, 
  IsUrl, 
  IsOptional 
} from 'class-validator';

export class SubmitExpenseDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama pengeluaran (misal: Beli Konsumsi) wajib diisi' })
  title!: string;

  @IsNumber()
  @Min(1, { message: 'Nominal pengeluaran harus lebih dari 0' })
  amount!: number;

  @IsUrl({}, { message: 'Format URL bukti foto/nota tidak valid' })
  @IsOptional()
  // Opsional saat draft, tapi Service harus memvalidasi ini wajib jika ingin dicairkan
  proofImage?: string; 
}