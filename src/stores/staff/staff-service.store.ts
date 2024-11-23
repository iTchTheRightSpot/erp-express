import { IStaffServiceStore } from './staff.interface.store';
import { StaffServiceEntity } from '@models/staff/staff.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class StaffServiceStore implements IStaffServiceStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: StaffServiceEntity): Promise<StaffServiceEntity> {
    const q = `
        INSERT INTO staff_service (staff_id, service_id)
        VALUES ($1, $2)
        RETURNING junction_id, staff_id, service_id
    `;

    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.db.exec(q, s.staff_id, s.service_id);
        resolve(res.rows[0] as StaffServiceEntity);
      } catch (e) {
        this.logger.error(`exception saving to staff_service table ${e}`);
        reject(e);
      }
    });
  }

  countByStaffIdAndServiceId(
    staffId: string,
    serviceId: string
  ): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          'SELECT COUNT(*) FROM staff_service WHERE staff_id = $1 AND service_id = $2',
          staffId,
          serviceId
        );

        resolve(Number(res.rows[0].count));
      } catch (e) {
        this.logger.error(
          `exception counting StaffServiceEntity by staffId and serviceId ${e}`
        );
        reject(e);
      }
    });
  }
}
