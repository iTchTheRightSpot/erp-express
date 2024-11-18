import { Pool, PoolClient } from 'pg';
import { DevelopmentLogger } from '@utils/log';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { ServiceStore } from '@stores/service/service.store';
import { IServiceStore } from '@stores/service/service.interface.store';
import { ServiceEntity } from '@models/service/service.model';

describe('service store', () => {
  let pool: Pool;
  let client: PoolClient;
  const logger = new DevelopmentLogger();
  let store: IServiceStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    store = new ServiceStore(logger, db);
  });

  beforeEach(async () => await client.query('BEGIN'));

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should save service entity and find by name', async () => {
    // method to test
    const save = await store.save({
      name: 'service',
      price: '180.17',
      duration: 3600,
      clean_up_time: 30 * 60
    } as ServiceEntity);

    // assert
    expect(save.service_id).toBeGreaterThan(0);

    // method to test
    const find = await store.serviceByName('service');
    const notFound = await store.serviceByName('services');

    // assert
    expect(save).toEqual(find);
    expect(notFound).toBeUndefined();
  });
});
