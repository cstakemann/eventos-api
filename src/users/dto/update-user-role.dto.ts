import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateUserRoleDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    @ApiProperty()
    roleId: number;

    @IsUUID()
    @ApiProperty()
    userId: string;
}
