import { Pool, PoolClient } from 'pg';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { StaffStore } from '@stores/staff/staff.store';
import { IProfile } from '@models/profile/profile.model';
import { IProfileStore } from '@stores/profile/profile.interface.store';
import { ProfileStore } from '@stores/profile/profile.store';
import { IStaff } from '@models/staff/staff.model';

describe('staff store', () => {
  let pool: Pool;
  let client: PoolClient;
  let profile: IProfile;
  let profileStore: IProfileStore;
  let store: IStaffStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const logger = new DevelopmentLogger();
    const db = new MockLiveDatabaseClient(client);
    profileStore = new ProfileStore(logger, db);
    store = new StaffStore(logger, db);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    profile = await profileStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com'
    } as IProfile);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe('saving staff behavior', () => {
    it('should save staff & find by uuid', async () => {
      // method to test
      const staff = await store.save({
        profile_id: profile.profile_id
      } as IStaff);

      // assert
      expect(staff.staff_id).toBeGreaterThan(0);

      // method to test
      const find = await store.staffByUUID(staff.uuid);

      // assert
      expect(staff).toEqual(find);
    });
  });
});
