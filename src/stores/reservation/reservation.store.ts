import { IReservationStore } from './reservation.interface.store';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import {
  ReservationEntity,
  ReservationEnum
} from '@models/reservation/reservation.model';

export class ReservationStore implements IReservationStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(o: ReservationEntity): Promise<ReservationEntity> {
    const q = `
        INSERT INTO reservation (staff_id, name, email, description, address, phone, image_key, price, status, created_at, scheduled_for, expire_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING reservation_id, staff_id, name, email, description, address, phone, image_key, price, status, created_at, scheduled_for, expire_at
    `;

    return new Promise<ReservationEntity>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          q,
          o.staff_id,
          o.name.trim(),
          o.email.trim(),
          o.description?.trim() || null,
          o.address?.trim() || null,
          o.phone?.trim() || null,
          o.image_key?.trim() || null,
          o.price.toFixed(2),
          o.status,
          o.created_at,
          o.scheduled_for,
          o.expire_at
        );

        resolve(res.rows[0] as ReservationEntity);
        this.logger.log('new reservation saved');
      } catch (e) {
        this.logger.error(`failed to new reservation ${e}`);
        reject(e);
      }
    });
  }

  countReservationsForStaffByTimeAndStatuses(
    staffId: string,
    start: Date,
    end: Date,
    ...status: ReservationEnum[]
  ): Promise<number> {
    const statuses = `(${[...status].map((status) => `'${status}'`).join(', ')})`;
    const q = `
      SELECT COUNT(*) FROM reservation
      WHERE staff_id = $1 AND scheduled_for = $2
      AND expire_at = $3 AND status IN ${statuses}
    `;

    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(q, staffId, start, end);

        if (!res.rows) {
          resolve(0);
          return;
        }

        resolve(Number(res.rows[0].count));
      } catch (e) {
        this.logger.error(
          `exception counting reservations associated to staff id ${staffId}. err: ${e}`
        );
        reject(e);
      }
    });
  }
}
