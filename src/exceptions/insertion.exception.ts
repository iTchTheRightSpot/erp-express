import { HttpException } from './http.exception';

export class InsertionException extends HttpException {
  constructor(message?: string) {
    super(message || 'failed to save or update', 415);
  }
}
