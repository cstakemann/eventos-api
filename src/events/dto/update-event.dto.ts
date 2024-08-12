import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EventImage } from './imageName.dto';
import { Type } from 'class-transformer';

export class UpdateEventDto extends PartialType(CreateEventDto) {

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EventImage)
    currentImages: EventImage[];
    
    @IsString()
    @IsOptional()
    @ApiProperty()
    status: string;
}
