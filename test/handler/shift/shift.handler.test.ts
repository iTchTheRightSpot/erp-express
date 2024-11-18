import { Application } from 'express';
import { Pool, PoolClient } from 'pg';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { DevelopmentLogger } from '@utils/log';
import { IJwtService } from '@services/auth/auth.interface.service';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { MockLiveTransactionProvider } from '@mock/transaction';
import { initializeServices } from '@services/services';
import { createApp } from '@erp/app';
import { IStaff } from '@models/staff/staff.model';
import { twoDaysInSeconds } from '@utils/util';
import { IJwtObject } from '@models/auth.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { env } from '@utils/env';
import request from 'supertest';
import { IShift } from '@models/shift/shift.model';

describe('shift handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();
  let jwtService: IJwtService;
  let staff: IStaff;

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
    staff = await adapters.staffStore.save({} as IStaff);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should create a shift for staff', async () => {
    // given
    const body = {
      staff_id: staff.uuid,
      times: [
        {
          is_visible: true,
          is_reoccurring: true,
          start: new Date().toISOString(),
          duration: 3600
        }
      ]
    };

    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };

    const token = await jwtService.createJwt(obj, twoDaysInSeconds);

    // route to test
    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}shift`)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token.token}`]);

    // assert
    expect(res.status).toEqual(201);
  });

  it('should reject shift creation conflict', async () => {
    // given
    const end = new Date();
    end.setSeconds(end.getSeconds() + 60);

    await adapters.shiftStore.save({
      staff_id: staff.staff_id,
      shift_start: new Date(),
      shift_end: end
    } as IShift);

    const body = {
      staff_id: staff.uuid,
      times: [
        {
          is_visible: true,
          is_reoccurring: true,
          start: new Date().toISOString(),
          duration: 3600
        }
      ]
    };

    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };

    const token = await jwtService.createJwt(obj, twoDaysInSeconds);

    // route to test
    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}shift`)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token.token}`]);

    // assert
    expect(res.status).toEqual(400);
  });
});
