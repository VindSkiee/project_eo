import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class RequestAdditionalFundDto {
  @IsNumber()
  @Min(1, { message: 'Nominal dana tambahan minimal Rp1' })
  amount!: number;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi/alasan pengajuan dana tambahan wajib diisi' })
  description!: string;
}
