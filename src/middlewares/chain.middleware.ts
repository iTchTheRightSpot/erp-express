import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { ILogger } from '@utils/log';
import { HttpException } from '@exceptions/http.exception';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export const middlewareChain = {
  log: (log: ILogger) => logMiddleware(log),
  error: (log: ILogger) => errorMiddleware(log),
  requestBody: <T extends object>(log: ILogger, type: ClassConstructor<T>) =>
    requestBodyMiddleware(log, type)
};

// ref docs https://expressjs.com/en/resources/middleware/morgan.html
const logMiddleware = (log: ILogger) => {
  return morgan(
    (token: any, req: Request, res: Response) => {
      const clientIp =
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '';

      return JSON.stringify({
        method: token.method(req, res),
        url: token.method(req, res),
        status: Number.parseFloat(token.status(req, res)),
        content_length: token.res(req, res, 'content-length'),
        response_time: Number.parseFloat(token['response-time'](req, res)),
        IP: clientIp
      });
    },
    {
      stream: { write: (message: string) => log.log(message.trim()) }
    }
  );
};

const errorMiddleware = (logger: ILogger): express.ErrorRequestHandler => {
  return (
    err: HttpException,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const status = err.status || 500;
    const message = err.message || 'something went wrong';
    logger.error(err.stack);
    res.status(status).send({ message: message, status: status });
    next();
  };
};

function requestBodyMiddleware<T extends object>(
  log: ILogger,
  type: ClassConstructor<T>
): express.RequestHandler {
  return (req, res, next) => {
    const plain = plainToInstance(type, req.body);
    validate(plain)
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors[0].constraints
            ? Object.values(errors[0].constraints)[0]
            : 'validation failed';

          log.error(`validator middleware request error ${message}`);

          res.status(400).send({ status: 400, message: message });
        } else next();
      })
      .catch((err) => {
        log.error(`validator middleware catch block ${JSON.stringify(err)}`);
        res
          .status(400)
          .send({ status: 400, message: 'catch validation failed' });
      });
  };
}
