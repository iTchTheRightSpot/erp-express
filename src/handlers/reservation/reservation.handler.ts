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
import { ReservationPayload } from '@models/reservation/reservation.model';

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
