import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserEventDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
