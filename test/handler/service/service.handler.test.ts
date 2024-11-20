import { Application } from 'express';
import { createApp } from '@erp/app';
import { DevelopmentLogger } from '@utils/log';
import { initializeServices } from '@services/services';
import request from 'supertest';
import { env } from '@utils/env';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { MockLiveTransactionProvider } from '@mock/transaction';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { Pool, PoolClient } from 'pg';
import { IJwtService } from '@services/auth/auth.interface.service';
import { IJwtObject } from '@models/auth.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { twoDaysInSeconds } from '@utils/util';
import { StaffEntity } from '@models/staff/staff.model';

describe('service handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();
  let staff: StaffEntity;
  let jwtService: IJwtService;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    const tx = new MockLiveTransactionProvider(logger, client);
    adapters = initializeAdapters(logger, db, tx);
    const services = initializeServices(logger, adapters);
    jwtService = services.jwtService;
    app = createApp(logger, services);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    staff = await adapters.staffStore.save({} as StaffEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should create service', async () => {
    // given
    const body = {
      name: 'erp',
      price: '150.99',
      is_visible: true,
      duration: 3600,
      clean_up_time: 30 * 60
    };

    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };

    const token = await jwtService.createJwt(obj, twoDaysInSeconds);

    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}service`)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token.token}`]);

    // assert
    expect(res.status).toEqual(201);
  });
});
