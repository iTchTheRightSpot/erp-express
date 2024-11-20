import { Pool, PoolClient } from 'pg';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import {
  IPermissionStore,
  IRoleStore
} from '@stores/role/role.interface.store';
import { ProfileEntity } from '@models/profile/profile.model';
import { RoleStore } from '@stores/role/role.store';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { ProfileStore } from '@stores/profile/profile.store';
import {
  IPermission,
  IRole,
  PermissionEnum,
  RoleEnum
} from '@models/role.model';
import { PermissionStore } from '@stores/role/permission.store';
import { IDatabaseClient } from '@stores/db-client';
import { IProfileStore } from '@stores/profile/profile.interface.store';

describe('user_role store', () => {
  let pool: Pool;
  let client: PoolClient;
  const logger = new DevelopmentLogger();
  let profileStore: IProfileStore;
  let roleStore: IRoleStore;
  let dbClient: IDatabaseClient;
  let permissionStore: IPermissionStore;
  let profile: ProfileEntity;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    dbClient = new MockLiveDatabaseClient(client);
    profileStore = new ProfileStore(logger, dbClient);
    roleStore = new RoleStore(logger, dbClient);
    permissionStore = new PermissionStore(logger, dbClient);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    profile = await profileStore.save({
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'erp@email.com',
      image_key: 'image-key'
    } as ProfileEntity);
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
    const save = await roleStore.save(role);

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
    const save = await roleStore.save(role);

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
    const save = await roleStore.save(role);

    // assert
    expect(save.role_id).toBeGreaterThan(0);
    expect(save.role).toEqual(RoleEnum.STAFF);
    expect(save.profile_id).toBeGreaterThan(0);
  });

  it('should save permission', async () => {
    // given
    const role = await roleStore.save({
      role: RoleEnum.USER,
      profile_id: profile.profile_id
    } as IRole);

    // method to test
    const save = await permissionStore.save({
      permission: PermissionEnum.WRITE,
      role_id: role.role_id
    } as IPermission);

    // assert
    expect(save.permission_id).toBeGreaterThan(0);
  });
});
