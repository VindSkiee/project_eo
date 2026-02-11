import { IsNotEmpty, IsString, IsIn, Matches } from 'class-validator';

export class CreateGroupDto {
  // 1. Validasi NAMA (Format: RT/RW + Spasi + 2 Digit)
  // Contoh Valid: "RT 01", "RW 05", "RT 10"
  // Contoh Invalid: "RT1", "RT 1", "Pos Kamling"
  @IsString()
  @IsNotEmpty()
  @Matches(/^(RT|RW)\s\d{2}$/, {
    message: 'Nama harus berformat "RT XX" atau "RW XX" (Contoh: RT 01, RW 05)',
  })
  name!: string;

  // 2. Validasi TIPE (Tetap murni RT atau RW)
  // Gunanya agar nanti Anda bisa query: "Cari semua group yang tipenya RT"
  @IsString()
  @IsNotEmpty()
  @IsIn(['RT', 'RW']) 
  type!: string;
}