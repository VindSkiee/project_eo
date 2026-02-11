import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer'; // Penting untuk konversi query param string -> number
import { SystemRoleType } from '@prisma/client';
import { PaginationDto } from '@common/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // Search nama/email

  @IsOptional()
  @IsEnum(SystemRoleType)
  roleType?: SystemRoleType; 

  // --- TAMBAHAN BARU ---
  @IsOptional()
  @Type(() => Number) // Convert "5" dari URL menjadi angka 5
  @IsInt()
  communityGroupId?: number;
}