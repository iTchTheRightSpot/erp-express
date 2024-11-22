import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { ILogger } from '@utils/log';
import { IReservationService } from '@services/reservation/reservation.interface.service';
import { middleware } from '@middlewares/middleware';
import {
  AvailableTimesPayload,
  ReservationPayload
} from '@models/reservation/reservation.model';
import { isInvalidateMonthYear, resolveTimezone } from '@handlers/util.handler';
import moment from 'moment-timezone';

export class ReservationHandler {
  constructor(
    private readonly router: Router,
    private readonly logger: ILogger,
    private readonly service: IReservationService
  ) {
    this.register();
  }

  private readonly register = () => {
    this.router.post(
      '/reservation',
      middleware.requestBody(this.logger, ReservationPayload),
      this.create
    );
    this.router.get('/reservation', this.reservationAvailability);
  };

  private services(services: any): string[] {
    if (!services) return [];
    if (Array.isArray(services)) return services;
    if (typeof services === 'string') return [services];
    return [];
  }

  private readonly reservationAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { services, staff_id, month, year, timezone } = req.query;

    const staffId = staff_id as string | undefined;

    try {
      // TODO month & year cannot be in the past
      const obj = isInvalidateMonthYear(month, year);
      const resolvedTimezone = resolveTimezone(
        timezone,
        this.logger.timezone()
      );

      const date = this.logger.date();
      date.setMonth(obj.month);
      date.setFullYear(obj.year);
      const startInTimezone = moment(date).tz(resolvedTimezone);
      const lastDateOfMonth = startInTimezone.clone().endOf('month');

      const payload: AvailableTimesPayload = {
        services: this.services(services),
        staff_id: staffId || '',
        start: startInTimezone.toDate(),
        end: lastDateOfMonth.toDate(),
        timezone: resolvedTimezone
      };
      const arr = await this.service.reservationAvailability(payload);
      res.status(200).send(arr);
    } catch (e) {
      next(e);
    }
  };

  private readonly create: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.create(req.body as ReservationPayload);
      res.status(201).send({});
    } catch (e) {
      next(e);
    }
  };
}
