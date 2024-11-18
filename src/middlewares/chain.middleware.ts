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

export const middleware = {
  log: (log: ILogger) => logMiddleware(log),
  error: (log: ILogger) => errorMiddleware(log),
  requestBody: <T extends object>(log: ILogger, type: ClassConstructor<T>) =>
    requestBodyMiddleware(log, type),
  refreshToken: (log: ILogger, ser: IJwtService) => refreshToken(log, ser),
  hasRole: (log: ILogger, role: RoleEnum) => hasRole(log, role),
  hasRoleAndPermissions: (log: ILogger, rp: IRolePermission) =>
    hasRoleAndPermissions(log, rp)
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
        logger.log(
          `${refreshToken.name}: replacing jwt as it is within 1 day of expiration`
        );
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
      res.status(403).send({ status: 403, message: 'access denied' });
    } else if (
      !req.jwtClaim.obj.access_controls.some((obj) => obj.role === role)
    ) {
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
      res.status(403).send({ status: 403, message: 'access denied' });
    } else if (
      !validateRoleAndPermissions(rp, req.jwtClaim!.obj.access_controls)
    ) {
      res.status(403).send({ status: 403, message: 'access denied' });
    } else next();
  };
};
