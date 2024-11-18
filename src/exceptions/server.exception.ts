import { HttpException } from './http.exception';

export class ServerException extends HttpException {
  constructor(message?: string) {
    super(message || 'internal server error', 500);
  }
}
