import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReviewAdditionalFundDto {
  @IsBoolean()
  approved!: boolean;

  @IsNumber()
  @Min(1, { message: 'Nominal dana tambahan minimal Rp1' })
  @IsOptional()
  approvedAmount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
