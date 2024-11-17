import { Pool, PoolClient } from 'pg';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { StaffStore } from '@stores/staff/staff.store';
import { Profile } from '@models/profile/profile.model';
import { IProfileStore } from '@stores/profile/profile.interface.store';
import { ProfileStore } from '@stores/profile/profile.store';
import { Staff } from '@models/staff/staff.model';
import { InsertionException } from '@exceptions/insertion.exception';

describe('staff store', () => {
  let pool: Pool;
  let client: PoolClient;
  let profile: Profile;
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
    // method to test
    profile = await profileStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com'
    } as Profile);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe('saving staff behavior', () => {
    it(`should throw ${InsertionException.name} as profile_id is missing`, async () => {
      try {
        await store.save({} as Staff);
      } catch (e) {
        expect(e).toBeInstanceOf(InsertionException);
      }
    });

    it('should save staff', async () => {
      // method to test
      await store.save({ profile_id: profile.profile_id } as Staff);
    });
  });
});
