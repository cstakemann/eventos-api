import { IsString, IsInt, IsUrl, IsEnum, IsNotEmpty } from "class-validator";

export class CreateEventDocumentDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;
}
