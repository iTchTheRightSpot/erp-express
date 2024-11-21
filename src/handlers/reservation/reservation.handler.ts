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
    this.router.get('/reservation', this.availableTimes);
  };

  private services(services: any): string[] {
    if (!services) return [];
    if (Array.isArray(services)) return services;
    if (typeof services === 'string') return [services];
    return [];
  }

  private readonly availableTimes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { services, staff_id, month, year, timezone } = req.query;

    const staffId = staff_id as string | undefined;

    try {
      const obj = isInvalidateMonthYear(month, year);
      const resolvedTimezone = resolveTimezone(
        timezone,
        this.logger.timezone()
      );

      const payload: AvailableTimesPayload = {
        services: this.services(services),
        staff_id: staffId || '',
        month: obj.month,
        year: obj.year,
        timezone: resolvedTimezone
      };
      const arr = await this.service.staffAvailability(payload);
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
