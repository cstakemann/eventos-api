import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @IsString()
    @IsOptional()
    @ApiProperty()
    status: string;
}
