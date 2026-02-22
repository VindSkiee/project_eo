import { IsDateString, IsNotEmpty } from 'class-validator';

export class ExtendEventDateDto {
  @IsDateString()
  @IsNotEmpty({ message: 'Tanggal selesai baru (endDate) wajib diisi' })
  endDate: string;
}
