import { IStaffStore } from '@stores/staff/staff.interface.store';
import { IStaff } from '@models/staff/staff.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import { v4 as uuid } from 'uuid';

export class StaffStore implements IStaffStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: IStaff): Promise<IStaff> {
    return new Promise<IStaff>(async (resolve, reject) => {
      const query = `
            INSERT INTO staff (uuid, bio, profile_id)
            VALUES ($1, $2, $3)
            RETURNING staff_id, uuid, bio, profile_id
        `.trim();

      try {
        const res = await this.db.execContext(
          query,
          s.uuid || uuid(),
          s.bio || null,
          s.profile_id || null
        );

        const row = res.rows[0] as IStaff;
        row.staff_id = Number(row.staff_id);
        row.profile_id = Number(row.profile_id);

        resolve(row);
        this.logger.log('new staff saved');
      } catch (e) {
        this.logger.error(
          `exception inserting to staff table: ${JSON.stringify(e)}`
        );
        reject(e);
      }
    });
  }

  staffByUUID(uuid: string): Promise<IStaff | undefined> {
    return new Promise(async (resolve, reject) => {
      const q = 'SELECT * FROM staff WHERE uuid = $1';
      try {
        const res = await this.db.execContext(q, uuid.trim());

        if (!res.rows[0]) {
          this.logger.error(`no staff with uuid ${uuid.trim()} found`);
          return resolve(undefined);
        }

        const row = res.rows[0] as IStaff;
        row.staff_id = Number(row.staff_id);
        row.profile_id =
          row.profile_id !== null ? Number(row.profile_id) : null;

        resolve(row);
        this.logger.log(`staff with id ${uuid.trim()} retrieved`);
      } catch (e) {
        this.logger.error(
          `exception finding staff with uuid ${JSON.stringify(e)}`
        );
        reject(e);
      }
    });
  }
}
