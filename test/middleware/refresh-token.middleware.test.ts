import express from 'express';
import request from 'supertest';
import { DevelopmentLogger } from '@utils/log';
import cookieParser from 'cookie-parser';
import { middleware } from '@middlewares/chain.middleware';
import { env } from '@utils/env';
import { IJwtClaimsObject, IJwtResponse } from '@models/auth.model';

describe('refreshToken middleware', () => {
  let app: express.Express;
  const logger = new DevelopmentLogger();
  let jwtService: any;

  beforeEach(() => {
    jwtService = {
      validateJwt: jest.fn(),
      createJwt: jest.fn()
    };
    app = express();
    app.use(cookieParser());
    app.use(middleware.refreshToken(logger, jwtService));
    app.use('/route', (req, res) => {
      res.sendStatus(200);
    });
    app.use('/route/logout', (req, res) => {
      res.sendStatus(200);
    });
  });

  it('should call next token not present', async () => {
    const res = await request(app).get('/route');
    expect(res.status).toBe(200);
    expect(jwtService.validateJwt).toBeCalledTimes(0);
  });

  it('should call next. path is logout', async () => {
    const res = await request(app).get('/route/logout');
    expect(res.status).toBe(200);
    expect(jwtService.validateJwt).toBeCalledTimes(0);
  });

  it('should not refresh token as it is not within 1 day of expiration', async () => {
    // given
    const expireAt = logger.date();
    expireAt.setDate(expireAt.getDate() + 3);

    const obj = {
      exp: Math.floor(expireAt.getTime() / 1000)
    } as IJwtClaimsObject;

    // when
    jwtService.validateJwt.mockResolvedValue(obj);

    // request
    const res = await request(app)
      .get('/route')
      .set('Cookie', `${env.COOKIENAME}=testToken`);

    // assert
    expect(res.status).toBe(200);
    expect(jwtService.validateJwt).toBeCalledTimes(1);
    expect(jwtService.createJwt).toBeCalledTimes(0);
  });

  it('should refresh the token as it is within 1 day of expiration', async () => {
    // given
    const nowInSeconds = Date.now() / 1000;
    const sub5Hrs = nowInSeconds - 5 * 60 * 60;
    const claims = { exp: sub5Hrs } as IJwtClaimsObject;

    // when
    jwtService.validateJwt.mockResolvedValue(claims);
    jwtService.createJwt.mockResolvedValue({} as IJwtResponse);

    // request
    const res = await request(app)
      .get('/route')
      .set('Cookie', `${env.COOKIENAME}=testToken`);

    // assert
    expect(res.status).toBe(200);
    expect(jwtService.validateJwt).toBeCalledTimes(1);
    expect(jwtService.createJwt).toBeCalledTimes(1);
  });
});
