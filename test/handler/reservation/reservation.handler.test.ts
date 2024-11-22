import { Application } from 'express';
import { Pool, PoolClient } from 'pg';
import { Adapters, initializeAdapters } from '@stores/adapters';
import { DevelopmentLogger } from '@utils/log';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { MockLiveTransactionProvider } from '@mock/transaction';
import { initializeServices } from '@services/services';
import { createApp } from '@erp/app';
import request from 'supertest';
import { env } from '@utils/env';
import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';
import Decimal from 'decimal.js';
import { ServiceEntity } from '@models/service/service.model';
import { ShiftEntity } from '@models/shift/shift.model';
import { AvailableTimesPayload } from '@models/reservation/reservation.model';

describe('reservation handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
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
    const services = initializeServices(logger, adapters);
    app = createApp(logger, services);
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
      const end = new Date(date);
      end.setHours(date.getHours() + 8);

      await adapters.shiftStore.save({
        staff_id: staff.staff_id,
        shift_start: date,
        shift_end: end,
        is_visible: true
      } as ShiftEntity);

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
      const body = res.body as AvailableTimesPayload[];
      expect(body.length).toBeGreaterThan(0);
    });
  });

  describe('flow of creating a reservation', () => {
    it('multiple users attempting to reserve the same time same timezone. only one should receive 201', async () => {
      // given
      const date = logger.date();
      date.setHours(9);
      const end = new Date(date);
      end.setHours(date.getHours() + 8);

      await adapters.shiftStore.save({
        staff_id: staff.staff_id,
        shift_start: date,
        shift_end: end,
        is_visible: true
      } as ShiftEntity);

      const res = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&month=${date.getMonth()}&year=${date.getFullYear()}&timezone=${logger.timezone()}`
        )
        .set('Content-Type', 'application/json');

      const body = res.body as AvailableTimesPayload[];
    });
  });
});
