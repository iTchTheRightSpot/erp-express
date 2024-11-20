import { IServiceReservationStore } from './reservation.interface.store';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import { ServiceReservationEntity } from '@models/reservation/reservation.model';

export class ServiceReservationStore implements IServiceReservationStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: ServiceReservationEntity): Promise<ServiceReservationEntity> {
    return new Promise<ServiceReservationEntity>(async (resolve, reject) => {
      const q = `
        INSERT INTO service_reservation (reservation_id, service_id)
        VALUES ($1, $2)
        RETURNING junction_id, reservation_id, service_id
      `;

      try {
        const res = await this.db.exec(q, s.reservation_id, s.service_id);
        resolve(res.rows[0] as ServiceReservationEntity);
      } catch (e) {
        this.logger.error(`exception saving to service_reservation ${e}`);
        reject(e);
      }
    });
  }
}
