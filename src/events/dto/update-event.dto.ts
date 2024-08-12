import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsString } from 'class-validator';
import { EventImage } from './imageName.dto';
import { Type } from 'class-transformer';

export class UpdateEventDto extends PartialType(CreateEventDto) {

    @IsString()
    @ApiProperty()
    currentImages: string
    
    @IsString()
    @IsOptional()
    @ApiProperty()
    status: string;
}
