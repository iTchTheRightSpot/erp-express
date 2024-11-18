import { IPermissionStore } from '@stores/role/role.interface.store';
import { IPermission } from '@models/role.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class PermissionStore implements IPermissionStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(obj: IPermission): Promise<IPermission> {
    return Promise.resolve({} as IPermission);
  }
}
