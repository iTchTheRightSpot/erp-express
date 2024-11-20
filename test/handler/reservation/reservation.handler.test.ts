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

describe('reservation handler', () => {
  let app: Application;
  let pool: Pool;
  let client: PoolClient;
  let adapters: Adapters;
  const logger = new DevelopmentLogger();

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    const tx = new MockLiveTransactionProvider(logger, client);
    adapters = initializeAdapters(logger, db, tx);
    const services = initializeServices(logger, adapters);
    app = createApp(logger, services);
  });

  beforeEach(async () => await client.query('BEGIN'));

  afterEach(async () => await client.query('ROLLBACK'));

  it('should create a reservation', async () => {
    // given
    const body = {
      staff_id: '0b2af07b-07dd-46ba-99f4-5ceab2499979',
      name: 'hello-world',
      email: 'erp@email.com',
      services: ['erp', 'small talks'],
      timezone: 'America/Toronto',
      time: new Date().getTime()
    };

    const res = await request(app)
      .post(`${env.ROUTE_PREFIX}reservation`)
      .send(body)
      .set('Content-Type', 'application/json');

    // assert
    expect(res.status).toEqual(201);
  });
});
