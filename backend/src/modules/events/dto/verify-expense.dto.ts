import { IsBoolean, IsNotEmpty } from 'class-validator';

export class VerifyExpenseDto {
    @IsBoolean()
    @IsNotEmpty()
    isValid!: boolean; // True jika nota sah, False jika ditolak/palsu
}