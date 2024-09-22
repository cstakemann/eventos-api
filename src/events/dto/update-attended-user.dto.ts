import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString, IsUUID } from "class-validator";

export class UpdateAttendedUser {
  @IsBoolean()
  @ApiProperty()
  attended: boolean;

  @IsUUID()
  @ApiProperty()
  userId: string;
}
