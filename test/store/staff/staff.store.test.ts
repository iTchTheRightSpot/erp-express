import { Pool, PoolClient } from 'pg';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { StaffStore } from '@stores/staff/staff.store';
import { UserProfile } from '@models/user_profile/user-profile.model';
import { IProfileStore } from '@stores/user_profile/user-profile.interface.store';
import { UserProfileStore } from '@stores/user_profile/user-profile.store';
import { Staff } from '@models/staff/staff.model';
import { InsertionException } from '@exceptions/insertion.exception';

describe('staff store', () => {
  let pool: Pool;
  let client: PoolClient;
  let profile: UserProfile;
  let profileStore: IProfileStore;
  let store: IStaffStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const logger = new DevelopmentLogger();
    const db = new MockLiveDatabaseClient(client);
    profileStore = new UserProfileStore(logger, db);
    store = new StaffStore(logger, db);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    // method to test
    profile = await profileStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'mrp@email.com'
    } as UserProfile);
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
