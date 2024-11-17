import { IStaffStore } from '@stores/staff/staff.interface.store';
import { Staff } from '@models/staff/staff.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import { InsertionException } from '@exceptions/insertion.exception';
import { v4 as uuid } from 'uuid';

export class StaffStore implements IStaffStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: Staff): Promise<Staff> {
    if (s.profile_id === undefined || s.profile_id === null)
      throw new InsertionException('staff profile_id cannot be missing');

    return new Promise<Staff>(async (resolve, reject) => {
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
          s.profile_id
        );

        const row = res.rows[0] as Staff;
        row.staff_id = Number(row.staff_id);
        row.profile_id = Number(row.profile_id);

        resolve(row);
      } catch (e) {
        this.logger.error(
          `exception inserting to staff table: ${JSON.stringify(e)}`
        );
        reject(e);
      }
    });
  }

  staffByUUID(uuid: string): Promise<Staff | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        const q = 'SELECT * FROM staff WHERE uuid = $1'
        const res = await this.db.execContext(q, uuid.trim())

        if (!res.rows[0]) {
          this.logger.error(`no staff with uuid ${uuid.trim()} found`);
          return resolve(undefined);
        }

        const row = res.rows[0] as Staff
        row.staff_id = Number(row.staff_id)
        row.profile_id = row.profile_id !== null ? Number(row.profile_id) : null

        resolve(row);
      } catch (e) {
        this.logger.error(`exception finding staff with uuid ${JSON.stringify(e)}`)
        reject(e)
      }
    })
  }
}
