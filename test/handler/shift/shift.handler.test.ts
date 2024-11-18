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
import { IShift, IShiftResponse } from '@models/shift/shift.model';

describe('shift handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();
  let jwtService: IJwtService;
  let staff: IStaff;
  let token: string;

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
    const obj: IJwtObject = {
      user_id: staff.uuid,
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
      ] as IRolePermission[]
    };
    const j = await jwtService.createJwt(obj, twoDaysInSeconds);
    token = j.token;
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

    // route to test
    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}shift`)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token}`]);

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

    // route to test
    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}shift`)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', [`${env.COOKIENAME}=${token}`]);

    // assert
    expect(res.status).toEqual(400);
  });

  describe('shift in range request', () => {
    it('reject no params set', async () => {
      // route to test
      const res = await request(app)
        .get(`${env.ROUTE_PREFIX}shift`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', [`${env.COOKIENAME}=${token}`]);

      // assert
      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual(
        '"month" and "year" query parameters are required'
      );
    });

    it('invalid month param', async () => {
      // route to test
      const res = await request(app)
        .get(`${env.ROUTE_PREFIX}shift?month=13&year=2023`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', [`${env.COOKIENAME}=${token}`]);

      // assert
      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual('"month" must be a valid month (1-12)');
    });

    it('success', async () => {
      // given
      const m: Promise<IShift>[] = [];

      for (let i = 0; i < 10; i++) {
        const start = new Date(2024, 0, i + 1);
        const end = new Date(start);
        m[i] = adapters.shiftStore.save({
          staff_id: staff.staff_id,
          shift_start: start,
          shift_end: end
        } as IShift);
      }

      // parallel save
      await Promise.all(m);

      // route to test
      const res = await request(app)
        .get(`${env.ROUTE_PREFIX}shift?month=1&year=2024`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', [`${env.COOKIENAME}=${token}`]);

      // assert
      expect(res.status).toEqual(200);
      expect((res.body as IShiftResponse[]).length).toEqual(10);
    });
  });
});
