import { IReservationService } from './reservation.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import {
  ReservationEntity,
  ReservationPayload
} from '@models/reservation/reservation.model';

export class ReservationService implements IReservationService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapter: Adapters,
    private readonly cache: ICache<string, {}>
  ) {}

  async create(r: ReservationPayload): Promise<void> {
    await this.adapter.reservationStore.save({} as ReservationEntity);
  }
}
