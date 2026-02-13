import { PartialType } from '@nestjs/swagger'; // atau dari '@nestjs/mapped-types'
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}