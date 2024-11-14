import { HttpException } from './http.exception';

export class InsertionException extends HttpException {
  constructor(message: string) {
    super(message, 415);
  }
}
