import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class GroupFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['RT', 'RW'])
  type?: string; // Filter kategori (Opsional)

  @IsOptional()
  @IsString()
  search?: string; // Input bebas: "01", "RT", "1", dll.
}