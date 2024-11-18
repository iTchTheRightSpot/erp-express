import { DevelopmentLogger } from '@utils/log';
import { PermissionEnum, RoleEnum, IRolePermission } from '@models/role.model';
import express from 'express';
import { IJwtObject } from '@models/auth.model';
import { middleware } from '@middlewares/chain.middleware';
import request from 'supertest';

describe('hasRole middleware', () => {
  const logger = new DevelopmentLogger();

  const injectClaims = (...rp: IRolePermission[]): express.RequestHandler => {
    return (req, res, next) => {
      req.jwtClaim = {
        obj: {
          user_id: 'uuid',
          access_controls: rp
        } as IJwtObject,
        iss: 'Landscape ERP',
        iat: 4000,
        exp: 8964651
      };
      next();
    };
  };

  it('should reject request. no claim in request', async () => {
    // given
    const app = express();

    // to test
    app.use(
      '/route',
      middleware.hasRole(logger, RoleEnum.DEVELOPER),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toBe(403);
  });

  it('should reject request. not matching role', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.DEVELOPER,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };

    const app = express();
    app.use(injectClaims(rp));

    // to test
    app.use(
      '/route',
      middleware.hasRole(logger, RoleEnum.STAFF),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toBe(403);
  });

  it('should accept matching role', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.STAFF,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };

    const app = express();
    app.use(injectClaims(rp));

    // to test
    app.use(
      '/route',
      middleware.hasRole(logger, RoleEnum.STAFF),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toBe(200);
  });
});
