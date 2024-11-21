import { IReservationService } from './reservation.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import {
  ReservationEntity,
  ReservationEnum,
  ReservationPayload,
  ServiceReservationEntity
} from '@models/reservation/reservation.model';
import { IMailService } from '@services/mail/mail.service';
import { NotFoundException } from '@exceptions/not-found.exception';
import { BadRequestException } from '@exceptions/bad-request.exception';
import moment from 'moment-timezone';
import { ServiceEntity } from '@models/service/service.model';

export class ReservationService implements IReservationService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly mailService: IMailService,
    private readonly cache: ICache<string, {}>
  ) {}

  private readonly matchStaffServices = (
    requestedServices: string[],
    availableServices: ServiceEntity[]
  ) => {
    const matchedServices = requestedServices
      .map((r) => r.toLowerCase().trim())
      .map((name) =>
        availableServices.find((s) => s.name.toLowerCase().trim() === name)
      )
      .filter((service): service is ServiceEntity => !!service);

    if (matchedServices.length !== requestedServices.length) {
      throw new BadRequestException(
        'no matching service(s) found for the selected staff'
      );
    }

    return matchedServices;
  };

  private readonly getMomentTime = (
    unixTimestamp: number,
    timezone: string,
    defaultTimezone: string
  ) => {
    const time = moment.unix(unixTimestamp / 1000);
    return moment.tz.names().includes(timezone)
      ? time.tz(timezone)
      : time.tz(defaultTimezone);
  };

  private readonly checkReservationConflicts = async (
    staffId: string,
    start: Date,
    end: Date,
    ...statuses: ReservationEnum[]
  ) => {
    const count =
      await this.adapters.reservationStore.countReservationsForStaffByTimeAndStatuses(
        staffId,
        start,
        end,
        ...statuses
      );

    if (count > 0) {
      throw new BadRequestException(
        `reservation creation failed: appointment conflicts with a ${ReservationEnum.PENDING} or ${ReservationEnum.CONFIRMED} appointment`
      );
    }
  };

  async create(r: ReservationPayload): Promise<void> {
    const staff = await this.adapters.staffStore.staffByUUID(r.staff_id.trim());
    if (!staff) throw new NotFoundException('invalid staff id');

    const services = await this.adapters.serviceStore.servicesByStaffId(
      staff.staff_id
    );
    const matchedServices = this.matchStaffServices(r.services, services);

    const start = this.getMomentTime(
      r.time,
      r.timezone,
      this.logger.timezone()
    );
    const durationSum = matchedServices.reduce((sum, s) => sum + s.duration, 0);
    const end = start.clone().add(durationSum, 'seconds');

    await this.checkReservationConflicts(
      staff.staff_id,
      start.toDate(),
      end.toDate(),
      ReservationEnum.PENDING,
      ReservationEnum.CONFIRMED
    );

    await this.adapters.txProvider?.runInTransaction(async (adapters) => {
      const reservation = await adapters.reservationStore.save({
        staff_id: staff.staff_id,
        name: r.name.trim(),
        email: r.email.trim(),
        description: r.description?.trim() || null,
        address: r.address?.trim() || null,
        phone: r.phone?.trim() || null,
        image_key: null,
        price: '', // TODO add all prices using big decimal library
        status: ReservationEnum.PENDING,
        created_at: this.logger.date(),
        scheduled_for: start.toDate(),
        expire_at: end.toDate()
      } as ReservationEntity);
      for (let entity of matchedServices) {
        await adapters.serviceReservationStore.save({
          reservation_id: reservation.reservation_id,
          service_id: entity.service_id
        } as ServiceReservationEntity);
      }
    });

    await this.mailService.sendAppointmentCreation();
    this.cache.clear();
  }
}
