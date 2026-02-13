import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CancelEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan pembatalan wajib diisi' })
  @MinLength(5, { message: 'Alasan terlalu singkat' })
  reason!: string;
}