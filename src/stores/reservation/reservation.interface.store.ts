import {
  ReservationEntity,
  ReservationEnum,
  ServiceReservationEntity
} from '@models/reservation/reservation.model';

export interface IReservationStore {
  save(o: ReservationEntity): Promise<ReservationEntity>;
  countReservationsForStaffByTimeAndStatuses(
    staffId: string,
    start: Date,
    end: Date,
    ...status: ReservationEnum[]
  ): Promise<number>;
}

export interface IServiceReservationStore {
  save(s: ServiceReservationEntity): Promise<ServiceReservationEntity>;
}
