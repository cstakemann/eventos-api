import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @IsString()
  limit?: number;

  @IsOptional()
  @IsString()
  offset?: number;

  @IsString()
  @IsOptional()
  published?: string;
}
