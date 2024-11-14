import { Role } from '@models/role.model';

export interface IRoleStore {
  save(obj: Role): Promise<Role>;
}
