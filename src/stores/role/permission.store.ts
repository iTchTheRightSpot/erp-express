import { IPermissionStore } from '@stores/role/role.interface.store';
import { PermissionEntity } from '@models/role.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class PermissionStore implements IPermissionStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(p: PermissionEntity): Promise<PermissionEntity> {
    const q = `
      INSERT INTO permission (permission, role_id)
      VALUES ($1, $2)
      RETURNING permission_id, permission, role_id
    `;

    return new Promise<PermissionEntity>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(q, p.permission, p.role_id);
        resolve(res.rows[0] as PermissionEntity);
      } catch (e) {
        this.logger.error(`exception saving permission ${e}`);
        reject(e);
      }
    });
  }
}
