import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(1, { message: 'Amount minimal adalah 1' })
  amount!: number;

  @IsString()
  @IsOptional()
  orderId?: string;
}