import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "";
    if (exception?.code) {
      message = exception?.detail;
    } else if (exception?.response?.message) {
      message = exception?.response?.message;
    }

    const responseBody = {
      status: exception?.code ? 400 : httpStatus,
      timestamp: new Date().toISOString(),
      message,
      isSucceded: false,
    };

    const response = ctx.getResponse<Response>();

    httpAdapter.reply(ctx.getResponse(), responseBody, exception?.code ? 400 : httpStatus);
  }
}
