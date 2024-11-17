import { Permission, Role } from '@models/role.model';

export interface IRoleStore {
  save(obj: Role): Promise<Role>;
}

export interface IPermissionStore {
  save(obj: Permission): Promise<Permission>;
}
