import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UserEventDto{
    @IsInt()
    @Min(1)
    @ApiProperty()
    eventId: number;
}
