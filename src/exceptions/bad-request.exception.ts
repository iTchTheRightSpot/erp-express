import { HttpException } from './http.exception';

export class BadRequestException extends HttpException {
  constructor(message?: string) {
    super(message || 'bad request', 400);
  }
}
