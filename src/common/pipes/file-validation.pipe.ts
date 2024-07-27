import { Injectable, PipeTransform, BadRequestException } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(files: any) {
    // Define tus restricciones de validación
    const maxSize = 5000000; // 5MB
    const allowedFormats = ["image/jpeg"];

    if (files.images) {
      for (const file of files.images) {
        if (file.size > maxSize) {
          throw new BadRequestException(
            `File ${file.originalname} is too large. Maximum size is 5MB.`
          );
        }
        if (!allowedFormats.includes(file.mimetype)) {
          throw new BadRequestException(
            `File ${file.originalname} has an invalid format. Allowed formats are JPEG.`
          );
        }
      }
    }

    return files;
  }
}
