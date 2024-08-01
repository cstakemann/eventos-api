import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @ApiProperty()
  mainImage?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  instructions?: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  time: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  date: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(0)
  @ApiProperty()
  quota: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  duration: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty()
  published?: boolean;
}
