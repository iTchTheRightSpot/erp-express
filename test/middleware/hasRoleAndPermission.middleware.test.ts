import { DevelopmentLogger } from '@utils/log';
import { PermissionEnum, RoleEnum, IRolePermission } from '@models/role.model';
import express from 'express';
import request from 'supertest';
import { IJwtObject } from '@models/auth.model';
import { middleware } from '@middlewares/chain.middleware';

describe('hasRoleAndPermission', () => {
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

  it('should reject request. no claim', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.DEVELOPER,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };

    const app = express();

    // to test
    app.use(
      '/route',
      middleware.hasRoleAndPermissions(logger, rp),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toBe(403);
  });

  it('should reject request. no matching role', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.DEVELOPER,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };
    const rp1: IRolePermission = {
      role: RoleEnum.STAFF,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };

    const app = express();
    app.use(injectClaims(rp));

    // to test
    app.use(
      '/route',
      middleware.hasRoleAndPermissions(logger, rp1),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toBe(403);
  });

  it('should reject request. matching role but not permissions', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.DEVELOPER,
      permissions: [PermissionEnum.READ]
    };

    const rp1: IRolePermission = {
      role: RoleEnum.DEVELOPER,
      permissions: [PermissionEnum.READ, PermissionEnum.WRITE]
    };

    const app = express();
    app.use(injectClaims(rp));

    // to test
    app.use(
      '/route',
      middleware.hasRoleAndPermissions(logger, rp1),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toEqual(403);
  });

  it('should accept request. matching role & permissions', async () => {
    // given
    const rp: IRolePermission = {
      role: RoleEnum.USER,
      permissions: [PermissionEnum.READ]
    };

    const rp1: IRolePermission = {
      role: RoleEnum.USER,
      permissions: [PermissionEnum.READ]
    };

    const app = express();
    app.use(injectClaims(rp));

    // to test
    app.use(
      '/route',
      middleware.hasRoleAndPermissions(logger, rp1),
      (req, res) => {
        res.sendStatus(200);
      }
    );

    const res = await request(app).get('/route');

    // assert
    expect(res.status).toEqual(200);
  });
});
