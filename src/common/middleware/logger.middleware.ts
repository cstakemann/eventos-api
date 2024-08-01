import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  

  use(req: Request, res: Response, next: NextFunction) {
    const logger = new Logger(LoggerMiddleware.name);
    const { method, originalUrl, headers, body } = req;
    const start = Date.now();

    // Capture the response
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks = [];

    res.write = function (chunk, ...args) {
      chunks.push(chunk);
      return oldWrite.apply(res, [chunk, ...args]);
    };

    res.end = function (chunk, ...args) {
      if (chunk) {
        chunks.push(chunk);
      }

      const responseBody = Buffer.concat(chunks).toString('utf8');
      const { statusCode } = res;
      const responseTime = Date.now() - start;

      const logMessage = `Method: ${method} | URL: ${originalUrl} | Status: ${statusCode} | ResponseTime: ${responseTime}ms | RequestBody: ${JSON.stringify(body)} | RequestHeaders: ${JSON.stringify(headers)} | ResponseBody: ${responseBody}`;

      logger.log(logMessage);

      oldEnd.apply(res, [chunk, ...args]);
    }.bind(this);

    next();
  }
}
