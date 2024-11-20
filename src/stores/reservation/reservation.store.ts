import { IReservationStore } from './reservation.interface.store';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';
import {
  ReservationEntity,
  ReservationEnum
} from '@erp/models/reservation/reservation.model';

export class ReservationStore implements IReservationStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(o: ReservationEntity): Promise<ReservationEntity> {
    return Promise.resolve({} as ReservationEntity);
  }

  countReservationsForStaffByTimeAndStatuses(
    staffId: string,
    start: Date,
    end: Date,
    ...status: ReservationEnum[]
  ): Promise<number> {
    return Promise.resolve(0);
  }
}
