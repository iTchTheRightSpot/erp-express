import { Pool, PoolClient } from 'pg';
import {
  IStaffServiceStore,
  IStaffStore
} from '@stores/staff/staff.interface.store';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { StaffStore } from '@stores/staff/staff.store';
import { ProfileEntity } from '@models/profile/profile.model';
import { IProfileStore } from '@stores/profile/profile.interface.store';
import { ProfileStore } from '@stores/profile/profile.store';
import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';
import { IServiceStore } from '@stores/service/service.interface.store';
import { ServiceStore } from '@stores/service/service.store';
import { StaffServiceStore } from '@stores/staff/staff-service.store';
import { ServiceEntity } from '@models/service/service.model';

describe(`${StaffStore.name} and ${StaffServiceStore.name}`, () => {
  let pool: Pool;
  let client: PoolClient;
  let profile: ProfileEntity;
  let profileStore: IProfileStore;
  let staffStore: IStaffStore;
  let serviceStore: IServiceStore;
  let staffServiceStore: IStaffServiceStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const logger = new DevelopmentLogger();
    const db = new MockLiveDatabaseClient(client);
    profileStore = new ProfileStore(logger, db);
    staffStore = new StaffStore(logger, db);
    serviceStore = new ServiceStore(logger, db);
    staffServiceStore = new StaffServiceStore(logger, db);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    profile = await profileStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com'
    } as ProfileEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe(`${StaffStore.name}`, () => {
    it('should save staff & find by uuid', async () => {
      // method to test
      const staff = await staffStore.save({
        profile_id: profile.profile_id
      } as StaffEntity);

      // assert
      expect(staff.staff_id).toBeGreaterThan(0);

      // method to test
      const find = await staffStore.staffByUUID(staff.uuid);

      // assert
      expect(staff).toEqual(find);
    });
  });

  describe(`${StaffServiceStore.name}`, () => {
    it('should save to staff_service table & find by staff_id and service_id', async () => {
      // given
      const staff = await staffStore.save({} as StaffEntity);
      const erp = await serviceStore.save({
        name: 'erp',
        price: '45.69',
        duration: 3600,
        clean_up_time: 30 * 60
      } as ServiceEntity);

      // method to test
      const save = await staffServiceStore.save({
        staff_id: staff.staff_id,
        service_id: erp.service_id
      } as StaffServiceEntity);

      // assert
      expect(save.junction_id).toBeGreaterThan(0);

      // method to test
      const count = await staffServiceStore.countByStaffIdAndServiceId(
        staff.staff_id,
        erp.service_id
      );
      const fakeCount = await staffServiceStore.countByStaffIdAndServiceId(
        staff.staff_id,
        0
      );

      // assert
      expect(count).toEqual(1);
      expect(fakeCount).toEqual(0);
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
      const find = await staffServiceStore.servicesByStaffId(staff.staff_id);

      // assert
      expect(find.length).toEqual(0);

      // assign service to staff
      await staffServiceStore.save({
        staff_id: staff.staff_id,
        service_id: erp.service_id
      } as StaffServiceEntity);

      // method to test & assert
      const res = await staffServiceStore.servicesByStaffId(staff.staff_id);
      expect(res.length).toEqual(1);
      expect(res[0]).toEqual('erp');
    });
  });
});
