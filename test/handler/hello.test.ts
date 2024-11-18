import request from 'supertest';
import { createApp } from '@erp/app';
import { Application } from 'express';
import { env } from '@utils/env';
import { ServicesRegistry } from '@services/services';
import { DevelopmentLogger } from '@utils/log';

describe('hello route test', () => {
  let app: Application;

  beforeAll(
    () => (app = createApp(new DevelopmentLogger(), {} as ServicesRegistry))
  );

  it('should return 200', async () =>
    await request(app).get(env.ROUTE_PREFIX).expect(200));
});
