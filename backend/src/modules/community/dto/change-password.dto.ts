import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string; // Wajib verifikasi password lama dulu!

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  newPassword!: string;
}