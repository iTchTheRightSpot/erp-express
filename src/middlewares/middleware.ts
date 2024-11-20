import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { ILogger } from '@utils/log';
import { HttpException } from '@exceptions/http.exception';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { IJwtService } from '@services/auth/auth.interface.service';
import { env } from '@utils/env';
import { twoDaysInSeconds } from '@utils/util';
import { RoleEnum, IRolePermission } from '@models/role.model';
import { UnauthorizedError } from 'express-jwt';

export const middleware = {
  log: (log: ILogger) => logger(log),
  error: (log: ILogger) => error(log),
  requestBody: <T extends object>(log: ILogger, type: ClassConstructor<T>) =>
    requestBody(log, type),
  refreshToken: (log: ILogger, ser: IJwtService) => refreshToken(log, ser),
  hasRole: (log: ILogger, role: RoleEnum) => hasRole(log, role),
  hasRoleAndPermissions: (log: ILogger, rp: IRolePermission) =>
    hasRoleAndPermissions(log, rp)
};

// ref docs https://expressjs.com/en/resources/middleware/morgan.html
const logger = (log: ILogger) => {
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

const error = (logger: ILogger): express.ErrorRequestHandler => {
  return async (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof HttpException) {
      const status = err.status;
      const message = err.message;
      logger.error(err.stack);
      res.status(status).send({ message: message, status: status });
    } else if (err instanceof UnauthorizedError) {
      logger.error(err.stack);
      res.status(401).send({ message: err.message, status: 401 });
    } else {
      logger.error(err.stack);
      res.status(500).send({ message: 'something went wrong', status: 500 });
    }
    next();
  };
};

function requestBody<T extends object>(
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

          log.error(`${requestBody.name} request error ${message}`);

          res.status(400).send({ status: 400, message: message });
        } else next();
      })
      .catch((err) => {
        log.error(`${requestBody.name} catch block ${JSON.stringify(err)}`);
        res
          .status(400)
          .send({ status: 400, message: 'catch validation failed' });
      });
  };
}

function isTokenExpiringSoon(date: Date, expirationInSeconds: number): boolean {
  const oneDayInSeconds = 24 * 60 * 60;
  const nowInSeconds = Math.floor(date.getTime() / 1000);
  return expirationInSeconds - nowInSeconds <= oneDayInSeconds;
}

const refreshToken = (
  logger: ILogger,
  service: IJwtService
): express.RequestHandler => {
  return async (req, res, next) => {
    if (!req.cookies || !req.cookies[env.COOKIENAME]) {
      next();
      return;
    }

    if (req.path.endsWith('/logout')) {
      next();
      return;
    }

    try {
      const claims = await service.validateJwt(req.cookies[env.COOKIENAME]);
      req.jwtClaim = claims;

      if (isTokenExpiringSoon(logger.date(), claims.exp)) {
        const obj = await service.createJwt(claims.obj, twoDaysInSeconds);
        res.cookie(env.COOKIENAME, obj.token, {
          maxAge: twoDaysInSeconds * 1000,
          expires: obj.exp
        });
        logger.log(`${refreshToken.name}: refreshing token`);
      }

      next();
    } catch (e) {
      logger.error(`${refreshToken.name} ${e}`);
      res.status(401).send({ message: 'unauthorized', status: 401 });
    }
  };
};

const hasRole = (logger: ILogger, role: RoleEnum): express.RequestHandler => {
  return (req, res, next) => {
    if (!req.jwtClaim) {
      logger.error('access denied jwtClaims not present');
      res.status(403).send({ status: 403, message: 'access denied' });
    } else if (
      !req.jwtClaim.obj.access_controls.some((obj) => obj.role === role)
    ) {
      logger.error('access denied not matching role');
      res.status(403).send({ status: 403, message: 'access denied' });
    } else next();
  };
};

const validateRoleAndPermissions = (
  rp: IRolePermission,
  rps: IRolePermission[]
) => {
  const matchingRole = rps.find((obj) => obj.role === rp.role);
  if (!matchingRole) return false;
  return rp.permissions.every((permission) =>
    matchingRole.permissions.includes(permission)
  );
};

const hasRoleAndPermissions = (
  logger: ILogger,
  rp: IRolePermission
): express.RequestHandler => {
  return (req, res, next) => {
    if (!req.jwtClaim) {
      logger.error('access denied jwtClaims not present in request');
      res.status(403).send({ status: 403, message: 'access denied' });
    } else if (
      !validateRoleAndPermissions(rp, req.jwtClaim!.obj.access_controls)
    ) {
      logger.error('access denied not matching role or permission');
      res.status(403).send({ status: 403, message: 'access denied' });
    } else next();
  };
};
