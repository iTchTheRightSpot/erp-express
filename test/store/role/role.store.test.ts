import { Pool, PoolClient } from 'pg';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { IRoleStore } from '@stores/role/role.interface.store';
import { IProfile } from '@models/profile/profile.model';
import { RoleStore } from '@stores/role/role.store';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { ProfileStore } from '@stores/profile/profile.store';
import { IRole, RoleEnum } from '@models/role.model';

describe('user_role store', () => {
  let pool: Pool;
  let client: PoolClient;
  const logger = new DevelopmentLogger();
  let store: IRoleStore;
  let profile: IProfile;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    store = new RoleStore(logger, new MockLiveDatabaseClient(client));
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    const userStore = new ProfileStore(
      logger,
      new MockLiveDatabaseClient(client)
    );
    profile = await userStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com',
      image_key: 'image-key'
    } as IProfile);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it(`should save user with user_role ${RoleEnum.USER}`, async () => {
    const role = {
      role: RoleEnum.USER,
      profile_id: profile.profile_id
    } as IRole;

    // method to test
    const save = await store.save(role);

    // assert
    expect(save.role_id).toBeGreaterThan(0);
    expect(save.role).toEqual(RoleEnum.USER);
    expect(save.profile_id).toBeGreaterThan(0);
  });

  it(`should save user with user_role ${RoleEnum.DEVELOPER}`, async () => {
    const role = {
      role: RoleEnum.DEVELOPER,
      profile_id: profile.profile_id
    } as IRole;

    // method to test
    const save = await store.save(role);

    // assert
    expect(save.role_id).toBeGreaterThan(0);
    expect(save.role).toEqual(RoleEnum.DEVELOPER);
    expect(save.profile_id).toBeGreaterThan(0);
  });

  it(`should save user with user_role ${RoleEnum.STAFF}`, async () => {
    const role = {
      role: RoleEnum.STAFF,
      profile_id: profile.profile_id
    } as IRole;

    // method to test
    const save = await store.save(role);

    // assert
    expect(save.role_id).toBeGreaterThan(0);
    expect(save.role).toEqual(RoleEnum.STAFF);
    expect(save.profile_id).toBeGreaterThan(0);
  });
});
