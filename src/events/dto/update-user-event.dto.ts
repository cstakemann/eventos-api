import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserEventDto } from './user-event.dto';
import { UserEventStatusEnum } from 'src/common/enums/status.enum';

export class UpdateUserEventDto extends PartialType(UserEventDto) {

    @IsString()
    @IsOptional()
    @ApiProperty()
    notes: string;

    @IsEnum(UserEventStatusEnum)
    @IsOptional()
    @ApiProperty()
    status: string;
}
