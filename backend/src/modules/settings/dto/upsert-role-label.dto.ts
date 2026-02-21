import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { SystemRoleType } from '@prisma/client';

export class UpsertRoleLabelDto {
  @IsEnum(SystemRoleType)
  roleType: SystemRoleType;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;
}
