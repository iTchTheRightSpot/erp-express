import {
  ReservationEntity,
  ServiceReservationEntity
} from '@models/reservation/reservation.model';

export interface IReservationStore {
  save(o: ReservationEntity): Promise<ReservationEntity>;
}

export interface IServiceReservationStore {
  save(s: ServiceReservationEntity): Promise<ServiceReservationEntity>;
}
