import { Pool, PoolClient } from 'pg';
import { DevelopmentLogger } from '@utils/log';
import { poolInstance } from '@mock/pool';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { ServiceStore } from '@stores/service/service.store';
import { IServiceStore } from '@stores/service/service.interface.store';
import { ServiceEntity } from '@models/service/service.model';
import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';
import {
  IStaffServiceStore,
  IStaffStore
} from '@stores/staff/staff.interface.store';
import { StaffStore } from '@stores/staff/staff.store';
import { StaffServiceStore } from '@stores/staff/staff-service.store';

describe('service store', () => {
  let pool: Pool;
  let client: PoolClient;
  const logger = new DevelopmentLogger();
  let serviceStore: IServiceStore;
  let staffStore: IStaffStore;
  let staffServiceStore: IStaffServiceStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    serviceStore = new ServiceStore(logger, db);
    staffStore = new StaffStore(logger, db);
    staffServiceStore = new StaffServiceStore(logger, db);
  });

  beforeEach(async () => await client.query('BEGIN'));

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should save service entity and find by name', async () => {
    // method to test
    const save = await serviceStore.save({
      name: 'service',
      price: '180.17',
      duration: 3600,
      clean_up_time: 30 * 60
    } as ServiceEntity);

    // assert
    expect(Number(save.service_id)).toBeGreaterThan(0);

    // method to test
    const find = await serviceStore.serviceByName('service');
    const notFound = await serviceStore.serviceByName('services');

    // assert
    expect(save).toEqual(find);
    expect(notFound).toBeUndefined();
  });

  it('should return all services offered by staff', async () => {
    // given
    const staff = await staffStore.save({} as StaffEntity);
    const erp = await serviceStore.save({
      name: 'erp',
      price: '45.69',
      duration: 3600,
      clean_up_time: 30 * 60
    } as ServiceEntity);

    // method to test
    const find = await serviceStore.servicesByStaffId(staff.staff_id);

    // assert
    expect(find.length).toEqual(0);

    // assign service to staff
    await staffServiceStore.save({
      staff_id: staff.staff_id,
      service_id: erp.service_id
    } as StaffServiceEntity);

    // method to test & assert
    const res = await serviceStore.servicesByStaffId(staff.staff_id);
    expect(res.length).toEqual(1);
    expect(res[0].name).toEqual('erp');
  });
});
