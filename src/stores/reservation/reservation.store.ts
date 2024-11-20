import { ReservationEntity } from '@erp/models/reservation/reservation.model';
import { IReservationStore } from './reservation.interface.store';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class ReservationStore implements IReservationStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(o: ReservationEntity): Promise<ReservationEntity> {
    return Promise.resolve({} as ReservationEntity);
  }
}
