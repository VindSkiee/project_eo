import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ProcessApprovalDto {
  @IsEnum(ApprovalStatus, { message: 'Status hanya boleh APPROVED atau REJECTED' })
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  // Wajib diisi (di level Service) jika statusnya REJECTED, agar panitia tahu alasannya
  notes?: string; 
}