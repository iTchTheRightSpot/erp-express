import { Pool, PoolClient } from 'pg';
import { poolInstance } from '@mock/pool';
import { IProfileStore } from '@stores/user_profile/user-profile.interface.store';
import { DevelopmentLogger } from '@utils/log';
import { UserProfileStore } from '@stores/user_profile/user-profile.store';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { UserProfile } from '@models/user_profile/user-profile.model';

describe('user_profile store', () => {
  let pool: Pool;
  let client: PoolClient;
  let store: IProfileStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    store = new UserProfileStore(
      new DevelopmentLogger(),
      new MockLiveDatabaseClient(client)
    );
  });

  beforeEach(async () => await client.query('BEGIN'));

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should create a user_profile and delete user_profile by profile_id', async () => {
    const u = {
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'mrp@email.com'
    } as UserProfile;

    // method to test
    const save = await store.save(u);

    // assert
    expect(save.profile_id).toBeGreaterThan(0);
    expect(save.firstname).toEqual(u.firstname);
    expect(save.lastname).toEqual(u.lastname);
    expect(save.email).toEqual(u.email);
    expect(save.image_key).toBeNull();

    // method to test and assert
    expect(await store.delete(save.profile_id)).toEqual(1);
  });
});
