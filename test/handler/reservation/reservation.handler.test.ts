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
import { InsertionException } from '@exceptions/insertion.exception';
import { ShiftEntity } from '../../../src/models/shift/shift.model';

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

  describe('bare bone endpoints', () => {
    it('should create a reservation', async () => {
      // given
      const start = logger.date();
      start.setHours(9);
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

  describe('flow of creating an appointment', () => {
    it(`simulate multiple users trying to reserve the same time. should throw ${InsertionException.name}`, async () => {});

    it('should retrieve all available appointment for staff. 1 service as a param', async () => {
      const timezone = 'America/Toronto';

      // route to test
      const res = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&month=1&year=2024&timezone=${timezone}`
        )
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(200);
    });

    it('should retrieve all available appointment for staff. multiple services as a param', async () => {
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
      const timezone = 'America/Toronto';

      // route to test
      const res = await request(app)
        .get(
          `${env.ROUTE_PREFIX}reservation?staff_id=${staff.uuid}&services=erp&services=accounting&month=1&year=2024&timezone=${timezone}`
        )
        .set('Content-Type', 'application/json');

      // assert
      expect(res.status).toEqual(200);
    });
  });
});
