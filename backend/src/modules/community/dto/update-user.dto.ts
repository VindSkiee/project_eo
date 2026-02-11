import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Kita extend dari CreateUserDto agar validasinya sama
// Tapi semua field jadi optional
export class UpdateUserDto extends PartialType(CreateUserDto) {}