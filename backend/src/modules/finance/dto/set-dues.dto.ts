import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SetDuesDto {
  @IsNumber()
  @Min(0)
  amount!: number; // Nominal iuran (misal 15000)

  @IsNumber()
  @Min(1)
  @Max(31)
  dueDay!: number; // Jatuh tempo tanggal berapa (1-31)
}