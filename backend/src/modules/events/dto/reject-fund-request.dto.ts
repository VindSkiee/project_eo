import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export enum RwTakeoverDecision {
  CANCEL_EVENT = 'CANCEL_EVENT',
  CONTINUE_WITH_ORIGINAL = 'CONTINUE_WITH_ORIGINAL',
}

export class RejectFundRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi agar RT mengerti alasannya' })
  reason!: string;

  @IsEnum(RwTakeoverDecision, { 
    message: 'Keputusan RW harus berupa CANCEL_EVENT atau CONTINUE_WITH_ORIGINAL' 
  })
  rwDecision!: RwTakeoverDecision;
}