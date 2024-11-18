import { IPermissionStore } from '@stores/role/role.interface.store';
import { IPermission } from '@models/role.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class PermissionStore implements IPermissionStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(p: IPermission): Promise<IPermission> {
    const q = `
      INSERT INTO permission (permission, role_id)
      VALUES ($1, $2)
      RETURNING permission_id, permission, role_id
    `;

    return new Promise<IPermission>(async (resolve, reject) => {
      try {
        const res = await this.db.execContext(q, p.permission, p.role_id);

        const row = res.rows[0] as IPermission;
        row.permission_id = Number(row.permission_id);
        row.role_id = Number(row.role_id);

        resolve(row);
      } catch (e) {
        this.logger.error(`exception saving permission ${e}`);
        reject(e);
      }
    });
  }
}
