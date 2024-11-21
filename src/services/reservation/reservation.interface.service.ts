import {
  AvailableTimesPayload,
  AvailableTimesResponse,
  ReservationPayload
} from '@models/reservation/reservation.model';

export interface IReservationService {
  create(r: ReservationPayload): Promise<void>;
  reservationAvailability(
    o: AvailableTimesPayload
  ): Promise<AvailableTimesResponse[]>;
}
