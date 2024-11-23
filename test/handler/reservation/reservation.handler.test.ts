import { Application } from 'express';
import { Pool, PoolClient } from 'pg';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { DevelopmentLogger } from '@utils/log';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { MockLiveTransactionProvider } from '@mock/transaction';
import { initializeServices, ServicesRegistry } from '@services/services';
import { createApp } from '@erp/app';
import request from 'supertest';
import { env } from '@utils/env';
import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';
import Decimal from 'decimal.js';
import { ServiceEntity } from '@models/service/service.model';
import { ShiftEntity, ShiftPayload } from '@models/shift/shift.model';
import { AvailableTimesResponse } from '@models/reservation/reservation.model';
import { IJwtObject } from '@models/auth.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { twoDaysInSeconds } from '@utils/util';

describe('reservation handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let servicesRegistry: ServicesRegistry;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();
  let staff: StaffEntity;
  let erp: ServiceEntity;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    const tx = new MockLiveTransactionProvider(logger, client);
    adapters = initializeAdapters(logger, db, tx);
    servicesRegistry = initializeServices(logger, adapters);
    app = createApp(logger, servicesRegistry);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    staff = await adapters.staffStore.save({} as StaffEntity);
    erp = await adapters.serviceStore.save({
      name: 'erp',
      price: new Decimal(65.44),
      duration: 3600,
      clean_up_time: 60 * 30
    } as ServiceEntity);
    await adapters.staffServiceStore.save({
      staff_id: staff.staff_id,
      service_id: erp.service_id
    } as StaffServiceEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe('creating a reservation', () => {
    it('invalid service', async () => {
      const body = {
        staff_id: staff.uuid,
        name: 'erp user',
        email: 'erp@email.com',
        services: ['invalid service'],
        timezone: logger.timezone(),
        time: logger.date().getTime()
      };

      // route to test
      const res = await request(app)
        .post(`${env.ROUTE_PREFIX}reservation`)
        .send(body)
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(400);
      expect(res.body.message).toContain(
        'The following services were not found for the selected staff'
      );
    });

    it('invalid reservation time', async () => {
      const body = {
        staff_id: staff.uuid,
        name: 'erp user',
        email: 'erp@email.com',
        services: [erp.name],
        timezone: logger.timezone(),
        time: logger.date().getTime()
      };

      // route to test
      const res = await request(app)
        .post(`${env.ROUTE_PREFIX}reservation`)
        .send(body)
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual('invalid reservation time');
    });

    it('cannot create an reservation for a past day', async () => {
      // given
      const start = logger.date();
      start.setHours(start.getHours() - 1);

      const body = {
        staff_id: staff.uuid,
        name: 'erp user',
        email: 'erp@email.com',
        services: [erp.name],
        timezone: logger.timezone(),
        time: start.getTime()
      };

      // route to test
      const res = await request(app)
        .post(`${env.ROUTE_PREFIX}reservation`)
        .send(body)
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(400);
      expect(res.body.message).toEqual(
        'cannot make a reservation for a past day'
      );
    });

    it('successful reservation', async () => {
      // given
      const start = logger.date();
      start.setHours(24);
      const end = new Date(start);
      end.setHours(end.getHours() + 8);

      // pre-save
      await adapters.shiftStore.save({
        staff_id: staff.staff_id,
        shift_start: start,
        shift_end: end,
        is_visible: true
      } as ShiftEntity);

      const body = {
        staff_id: staff.uuid,
        name: 'erp user',
        email: 'erp@email.com',
        services: [erp.name],
        timezone: logger.timezone(),
        time: start.getTime()
      };

      // route to test
      const res = await request(app)
        .post(`${env.ROUTE_PREFIX}reservation`)
        .send(body)
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(201);
    });
  });

  describe('retrieve valid reservation times', () => {
    it('should retrieve all available appointment for staff. 1 service as a param', async () => {
      // route to test
      const res = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&month=1&year=2024&timezone=${logger.timezone()}`
        )
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(200);
    });

    it('should retrieve all available appointment for staff. multiple services as a param', async () => {
      // given
      const date = logger.date();
      date.setHours(9);

      const accounting = await adapters.serviceStore.save({
        name: 'accounting',
        price: new Decimal(65.44),
        duration: 3600,
        clean_up_time: 60 * 30
      } as ServiceEntity);
      await adapters.staffServiceStore.save({
        staff_id: staff.staff_id,
        service_id: accounting.service_id
      } as StaffServiceEntity);

      // route to test
      const res = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&services=accounting&month=${date.getMonth()}&year=${date.getFullYear()}&timezone=${logger.timezone()}`
        )
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(200);
    });
  });

  describe('flow of creating a reservation', () => {
    let token = '';
    beforeEach(async () => {
      const obj: IJwtObject = {
        user_id: staff.uuid,
        access_controls: [
          { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] }
        ] as IRolePermission[]
      };
      const j = await servicesRegistry.jwtService.createJwt(
        obj,
        twoDaysInSeconds
      );
      token = j.token;
    });

    it('concurrent requests to reserve the same time in the same timezone. only one should receive 201', async () => {
      // given
      const date = logger.date();
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);

      // simulate staff creating schedule
      const shiftPayload = new ShiftPayload();
      shiftPayload.staff_id = staff.uuid;
      shiftPayload.times = [
        {
          is_visible: true,
          is_reoccurring: false,
          start: date.toISOString(),
          duration: 8 * 60 * 60
        }
      ];

      const createScheduleResponse = await request(app)
        .post(`${env.ROUTE_PREFIX}shift`)
        .send(shiftPayload)
        .set('Content-Type', 'application/json')
        .set('Cookie', [`${env.COOKIENAME}=${token}`]);

      expect(createScheduleResponse.status).toEqual(201);

      // simulate all users querying for available schedules
      const getReservationResponse = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&month=${date.getMonth()}&year=${date.getFullYear()}&timezone=${logger.timezone()}`
        )
        .set('Content-Type', 'application/json');

      const getReservationResponseBody =
        getReservationResponse.body as AvailableTimesResponse[];
      expect(getReservationResponseBody.length).toBeGreaterThan(0);
      expect(getReservationResponseBody[0].times.length).toBeGreaterThan(0);

      // simulate multiple users attempting to reserve the same time
      const arr = Array.from({ length: 10 }, (_, i) => {
        const body = {
          staff_id: staff.uuid,
          name: `erp user-${i + 1}`,
          email: `erp-user-${i + 1}@email.com`,
          services: [erp.name],
          timezone: logger.timezone(),
          time: getReservationResponseBody[0].times[1]
        };

        // concurrent reservation request
        return request(app)
          .post(`${env.ROUTE_PREFIX}reservation`)
          .send(body)
          .set('Content-Type', 'application/json');
      });

      const allCreateReservationResponses = await Promise.all(arr);
      const results = allCreateReservationResponses.map((res) => ({
        status: res.status,
        message: res.body?.message
      }));

      // assert
      expect(
        results.filter(
          (obj) => obj.message === 'reservation is no longer available'
        ).length
      ).toBe(9);
      expect(results.filter((obj) => obj.status === 201).length).toBe(1);
      expect(results.filter((obj) => obj.status === 415).length).toBe(9);
    });
  });
});
