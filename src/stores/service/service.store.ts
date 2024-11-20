import { IServiceStore } from './service.interface.store';
import { ServiceEntity } from '@models/service/service.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class ServiceStore implements IServiceStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: ServiceEntity): Promise<ServiceEntity> {
    const q = `
        INSERT INTO service (name, price, is_visible, duration, clean_up_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING service_id, name, price, is_visible, duration, clean_up_time
    `;

    return new Promise<ServiceEntity>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          q,
          s.name.trim(),
          s.price.trim(),
          s.is_visible === undefined ? false : s.is_visible,
          s.duration,
          s.clean_up_time
        );

        const row = res.rows[0] as ServiceEntity;
        row.duration = Number(row.duration);
        row.clean_up_time = Number(row.clean_up_time);

        resolve(row);
      } catch (e) {
        this.logger.error(`exception saving to service table ${e}`);
        reject(e);
      }
    });
  }

  serviceByName(name: string): Promise<ServiceEntity | undefined> {
    return new Promise<ServiceEntity | undefined>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          'SELECT * FROM service WHERE name = $1',
          name.trim()
        );

        if (!res.rows[0]) {
          resolve(undefined);
          this.logger.log(`no service found with name ${name}`);
          return;
        }

        const row = res.rows[0] as ServiceEntity;
        row.duration = Number(row.duration);
        row.clean_up_time = Number(row.clean_up_time);

        resolve(row);
      } catch (e) {
        this.logger.error(`exception finding service with name ${name} ${e}`);
        reject(e);
      }
    });
  }

  servicesByStaffId(staffId: string): Promise<ServiceEntity[]> {
    const q = `
      SELECT s.* FROM service s
      INNER JOIN staff_service ss ON ss.service_id = s.service_id
      WHERE ss.staff_id = $1
    `;

    return new Promise<ServiceEntity[]>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(q, staffId);
        if (!res.rows) {
          resolve([] as ServiceEntity[]);
          return;
        }
        resolve(res.rows as ServiceEntity[]);
      } catch (e) {
        this.logger.error(
          `exception retrieving service by staff id ${staffId}, err: ${e}`
        );
        reject(e);
      }
    });
  }
}
