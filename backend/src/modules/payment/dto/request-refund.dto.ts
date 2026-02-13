import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class RequestRefundDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}