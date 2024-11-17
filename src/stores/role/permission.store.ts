import { IPermissionStore } from '@stores/role/role.interface.store';
import { Permission } from '@models/role.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class PermissionStore implements IPermissionStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(obj: Permission): Promise<Permission> {
    return Promise.resolve({} as Permission);
  }
}
