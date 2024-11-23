import { IRoleStore } from '@stores/role/role.interface.store';
import { RoleEntity } from '@models/role.model';
import { IDatabaseClient } from '@stores/db-client';
import { ILogger } from '@utils/log';

export class RoleStore implements IRoleStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(obj: RoleEntity): Promise<RoleEntity> {
    return new Promise<RoleEntity>(async (resolve, reject) => {
      const q = `
        INSERT INTO role (role, profile_id)
        VALUES ($1, $2)
        RETURNING role_id, role, profile_id
      `;

      try {
        const result = await this.db.exec(q, obj.role, obj.profile_id);
        resolve(result.rows[0] as RoleEntity);
        this.logger.log('new role saved');
      } catch (e) {
        this.logger.error(`exception saving role ${JSON.stringify(e)}`);
        reject(e);
      }
    });
  }
}
