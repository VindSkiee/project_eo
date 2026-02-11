import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';

// Otomatis membuat semua field CreateGroupDto menjadi Optional
export class UpdateGroupDto extends PartialType(CreateGroupDto) {}