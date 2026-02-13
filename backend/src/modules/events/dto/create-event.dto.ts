import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  Min, 
  IsDate, 
  IsOptional, 
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kegiatan tidak boleh kosong' })
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi dan rincian kegiatan wajib diisi' })
  description!: string;

  @IsNumber()
  @Min(0, { message: 'Estimasi anggaran tidak boleh minus' })
  // Angka ini krusial karena akan menentukan apakah butuh approval RW atau cukup RT
  budgetEstimated!: number; 

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;
}