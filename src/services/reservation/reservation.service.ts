import { IReservationService } from './reservation.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import {
  AvailableTimesPayload,
  AvailableTimesResponse,
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
import Decimal from 'decimal.js';
import { ShiftEntity } from '@models/shift/shift.model';
import { InsertionException } from '@exceptions/insertion.exception';

export class ReservationService implements IReservationService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly mailService: IMailService,
    private readonly cache: ICache<string, AvailableTimesResponse[]>
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
      const unmatchedServices = requestedServices.filter(
        (r) =>
          !availableServices.some(
            (s) => s.name.toLowerCase().trim() === r.toLowerCase().trim()
          )
      );

      throw new BadRequestException(
        `The following services were not found for the selected staff: ${unmatchedServices.join(
          ', '
        )}. Please check your input and try again`
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
    const durationSum = matchedServices.reduce(
      (sum, s) => sum + (s.duration + s.clean_up_time),
      0
    );
    const end = start.clone().add(durationSum, 'seconds');

    const validShift =
      await this.adapters.shiftStore.countShiftsInRangeAndVisibility(
        staff.staff_id,
        start.toDate(),
        end.toDate(),
        true
      );
    if (validShift <= 0)
      throw new BadRequestException('invalid reservation time');

    await this.checkReservationConflicts(
      staff.staff_id,
      start.toDate(),
      end.toDate(),
      ReservationEnum.PENDING,
      ReservationEnum.CONFIRMED
    );

    await this.adapters.txProvider?.runInTransaction(async (adapters) => {
      const priceSum = matchedServices.reduce(
        (acc, curr) => acc.add(curr.price),
        new Decimal(0)
      );
      const reservation = await adapters.reservationStore.save({
        staff_id: staff.staff_id,
        name: r.name.trim(),
        email: r.email.trim(),
        description: r.description?.trim() || null,
        address: r.address?.trim() || null,
        phone: r.phone?.trim() || null,
        image_key: null,
        price: priceSum,
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

      const count =
        await this.adapters.reservationStore.countReservationsForStaffByTimeAndStatuses(
          staff.staff_id,
          start.toDate(),
          end.toDate(),
          ReservationEnum.PENDING,
          ReservationEnum.CONFIRMED
        );

      if (count > 1)
        throw new InsertionException('reservation is no longer available');
    });

    await this.mailService.sendAppointmentCreation();
    this.cache.clear();
  }

  private readonly createKey = (o: AvailableTimesPayload) =>
    `${o.services.join('_')}_${o.staff_id}_${o.start.getMonth()}_${o.start.getFullYear()}_${o.timezone}`;

  private readonly generateChunks = async (
    shifts: ShiftEntity[],
    seconds: number
  ) => {
    return await Promise.all(
      shifts.map(async (shift) => {
        const times: Date[] = [];

        let tempStart = new Date(shift.shift_start);
        const tempEnd = new Date(shift.shift_end);

        while (tempStart <= tempEnd) {
          times.push(new Date(tempStart));
          tempStart.setSeconds(tempStart.getSeconds() + seconds);
        }

        return { start: shift.shift_start, times };
      })
    );
  };

  async reservationAvailability(
    o: AvailableTimesPayload
  ): Promise<AvailableTimesResponse[]> {
    const key = this.createKey(o);
    const val = this.cache.get(key);
    if (val !== undefined) return val;

    const staff = await this.adapters.staffStore.staffByUUID(o.staff_id.trim());
    if (!staff) throw new NotFoundException('invalid staff id');

    const services = await this.adapters.serviceStore.servicesByStaffId(
      staff.staff_id
    );
    const matchedServices = this.matchStaffServices(o.services, services);

    // 1. sum up the service duration & clean up time
    const durationSum = matchedServices.reduce(
      (acc, cur) => acc + (cur.duration + cur.clean_up_time),
      0
    );

    // 2. find said staffs working hrs.
    // 2i. in the query, make sure the difference between
    // working hrs is greater than sum (point 1). use
    // DATEDIFF sql function.
    const shifts = await this.adapters.shiftStore.shiftsInRangeWithDifference(
      staff.staff_id,
      o.start,
      o.end,
      durationSum
    );

    // 3. in parallel, generate chunks of reservation times
    // based on each shift.
    const chunks = this.generateChunks(shifts, durationSum);

    // 4. in parallel filter times that contain in reservation
    // table with statuses PENDING, CONFIRMED
    // 5. transform to unix and respond.

    return Promise.resolve([]);
  }
}
