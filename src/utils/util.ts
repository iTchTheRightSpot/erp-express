import { CookieOptions, Response } from 'express';
import { env } from './env';
import { ILogger } from './log';
import { JwtResponse } from '@models/auth.model';

export const twoDaysInSeconds = 172800;

export const cookieResponse = (
  logger: ILogger,
  res: Response,
  status: number,
  obj: JwtResponse
) => {
  const options: CookieOptions = {
    maxAge: obj.exp.getTime() - logger.date().getTime(),
    expires: obj.exp,
    httpOnly: true,
    secure: env.COOKIESECURE,
    sameSite: env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none'
  };

  res.status(status).cookie(env.COOKIENAME, obj.token, options);
};
