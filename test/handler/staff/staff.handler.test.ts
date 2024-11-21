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
import { ServiceEntity } from '@models/service/service.model';
import { StaffEntity } from '@models/staff/staff.model';
import Decimal from 'decimal.js';

describe('staff handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();
  let jwtService: IJwtService;
  let staff: StaffEntity;
  let service: ServiceEntity;

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
    service = await adapters.serviceStore.save({
      name: 'service',
      price: new Decimal(63.0),
      duration: 3600,
      clean_up_time: 30 * 60
    } as ServiceEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should reject request. invalid params', async () => {
    // given
    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };

    const token = await jwtService.createJwt(obj, twoDaysInSeconds);

    // route to test
    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}staff/service`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token.token}`]);

    // assert
    expect(res.status).toEqual(400);
    expect(res.body.message).toEqual('staff_id and service_name are required');
  });

  it('should add service to staff', async () => {
    // given
    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };

    const token = await jwtService.createJwt(obj, twoDaysInSeconds);

    // route to test
    const res = await request(app)
      .post(
        `${env.ROUTE_PREFIX}staff/service?staff_id=${staff.uuid}&service_name=${service.name}`
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token.token}`]);

    // assert
    expect(res.status).toEqual(201);
  });
});
