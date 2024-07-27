import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @ApiProperty()
    title: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    color: string;
}
