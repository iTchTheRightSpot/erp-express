import { HttpException } from './http.exception';

export class UnauthorizedException extends HttpException {
  constructor(message: string) {
    const m =
      message.trim().length === 0
        ? 'unauthorized; full authentication is required to access this resource'
        : message;
    super(m, 401);
  }
}
