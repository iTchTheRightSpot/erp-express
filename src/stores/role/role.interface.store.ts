import { PermissionEntity, RoleEntity } from '@models/role.model';

export interface IRoleStore {
  save(obj: RoleEntity): Promise<RoleEntity>;
}

export interface IPermissionStore {
  save(obj: PermissionEntity): Promise<PermissionEntity>;
}
