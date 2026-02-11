import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsInt } from 'class-validator';
import { SystemRoleType } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  // --- TAMBAHAN FIELD PENTING ---
  @IsOptional()
  @IsString() // Bisa diganti @IsPhoneNumber('ID') jika ingin strict format +62
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
  // -----------------------------

  @IsEnum(SystemRoleType, { message: 'Tipe Role tidak valid' })
  roleType!: SystemRoleType; 

  @IsOptional()
  @IsInt()
  communityGroupId?: number;
}