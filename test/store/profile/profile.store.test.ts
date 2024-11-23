import { Pool, PoolClient } from 'pg';
import { poolInstance } from '@mock/pool';
import { IProfileStore } from '@stores/profile/profile.interface.store';
import { DevelopmentLogger } from '@utils/log';
import { ProfileStore } from '@stores/profile/profile.store';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { ProfileEntity } from '@models/profile/profile.model';

describe('profile store', () => {
  let pool: Pool;
  let client: PoolClient;
  let store: IProfileStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    store = new ProfileStore(
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

  it('should create a profile and delete profile by profile_id', async () => {
    const u = {
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com'
    } as ProfileEntity;

    // method to test
    const save = await store.save(u);

    // assert
    expect(Number(save.profile_id)).toBeGreaterThan(0);
    expect(save.firstname).toEqual(u.firstname);
    expect(save.lastname).toEqual(u.lastname);
    expect(save.email).toEqual(u.email);
    expect(save.image_key).toBeNull();

    // method to test and assert
    expect(await store.delete(save.profile_id)).toEqual(1);
  });
});
