import { IReservationService } from './reservation.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import {
  ReservationEntity,
  ReservationPayload
} from '@models/reservation/reservation.model';
import { IMailService } from '@services/mail/mail.service';
import { NotFoundException } from '@exceptions/not-found.exception';
import { BadRequestException } from '@exceptions/bad-request.exception';

export class ReservationService implements IReservationService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapter: Adapters,
    private readonly mailService: IMailService,
    private readonly cache: ICache<string, {}>
  ) {}

  async create(r: ReservationPayload): Promise<void> {
    const staff = await this.adapter.staffStore.staffByUUID(r.staff_id.trim());
    if (!staff) throw new NotFoundException('invalid staff id');

    const services = (
      await this.adapter.staffServiceStore.servicesByStaffId(staff.staff_id)
    ).map((s) => s.toLowerCase().trim());
    const matchAll = r.services.every((service) =>
      services.includes(service.toLowerCase().trim())
    );
    if (!matchAll)
      throw new BadRequestException(
        'no matching service(s) found for the selected staff'
      );

    await this.adapter.reservationStore.save({} as ReservationEntity);
  }
}
