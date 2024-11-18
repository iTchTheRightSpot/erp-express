import { IPermission, IRole } from '@models/role.model';

export interface IRoleStore {
  save(obj: IRole): Promise<IRole>;
}

export interface IPermissionStore {
  save(obj: IPermission): Promise<IPermission>;
}
