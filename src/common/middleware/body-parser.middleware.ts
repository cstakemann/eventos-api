import { Injectable, NestMiddleware } from '@nestjs/common';
import * as bodyParser from 'body-parser';

@Injectable()
export class BodyParserMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    bodyParser.urlencoded({ extended: true })(req, res, next);
  }
}
