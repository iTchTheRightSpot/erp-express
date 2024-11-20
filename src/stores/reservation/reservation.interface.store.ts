import { ReservationEntity } from '@models/reservation/reservation.model';

export interface IReservationStore {
  save(o: ReservationEntity): Promise<ReservationEntity>;
}
