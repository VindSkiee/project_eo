import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';

export class CreateFundRequestDto {
  @IsNumber()
  @Min(1, { message: 'Nominal pengajuan dana minimal lebih dari 0' })
  amount!: number;

  @IsString()
  @IsNotEmpty({ message: 'Tujuan/deskripsi pengajuan dana wajib diisi dengan jelas' })
  description!: string;

  // Opsional: Karena bisa jadi RT minta dana untuk kas operasional biasa, 
  // bukan untuk acara (Event) spesifik.
  @IsUUID('4', { message: 'Format ID Acara tidak valid' })
  @IsOptional()
  eventId?: string; 
}