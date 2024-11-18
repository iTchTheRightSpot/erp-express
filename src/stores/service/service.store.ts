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
        const res = await this.db.execContext(
          q,
          s.name.trim(),
          s.price.trim(),
          s.is_visible === undefined ? false : s.is_visible,
          s.duration,
          s.clean_up_time
        );

        const row = res.rows[0] as ServiceEntity;
        row.service_id = Number(row.service_id);
        row.duration = Number(row.duration);
        row.clean_up_time = Number(row.clean_up_time);

        resolve(row);
      } catch (e) {
        this.logger.error(`exception saving to service table ${e}`);
        reject(e);
      }
    });
  }
}
