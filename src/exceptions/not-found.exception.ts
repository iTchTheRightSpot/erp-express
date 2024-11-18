import { HttpException } from './http.exception';

export class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(message || 'not found', 404);
  }
}
