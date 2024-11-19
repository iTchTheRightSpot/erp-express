import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { ILogger } from '@utils/log';
import { IShiftService } from '@services/shift/shift.interface.service';
import { middleware } from '@middlewares/middleware';
import { ShiftPayload } from '@models/shift/shift.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import moment from 'moment-timezone';

export class ShiftHandler {
  constructor(
    private readonly router: Router,
    private readonly logger: ILogger,
    private readonly service: IShiftService
  ) {
    this.register();
  }

  private readonly register = () => {
    const rp: IRolePermission = {
      role: RoleEnum.STAFF,
      permissions: [PermissionEnum.WRITE]
    };

    this.router.get(
      '/shift',
      middleware.hasRole(this.logger, rp.role),
      this.shifts
    );

    this.router.post(
      '/shift',
      middleware.hasRoleAndPermissions(this.logger, rp),
      middleware.requestBody(this.logger, ShiftPayload),
      this.create
    );
  };

  private readonly isInvalidateReq = (month: any, year: any) => {
    if (!month || !year) {
      const m = '"month" and "year" query parameters are required';
      this.logger.error(m);
      return {
        message: m,
        bool: true
      };
    }

    const monthNumber = parseInt(month as string, 10);
    const yearNumber = parseInt(year as string, 10);

    if (isNaN(monthNumber) || isNaN(yearNumber)) {
      const m = '"month" and "year" must be valid numbers';
      this.logger.error(m);
      return {
        message: m,
        bool: true
      };
    }

    if (!moment(monthNumber, 'M', true).isValid()) {
      const m = '"month" must be a valid month (1-12)';
      this.logger.error(m);
      return { message: m, bool: true };
    }

    return { message: '', bool: false };
  };

  private readonly shifts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { staff_id, month, year, timezone } = req.query;

    const obj = this.isInvalidateReq(month, year);

    if (obj.bool) {
      res.setHeader('Content-Type', 'application/json').status(400).json({
        status: 400,
        message: obj.message
      });
      return;
    }

    const timezoneFromRequest = timezone as string | undefined;
    const staffId = staff_id as string | undefined;

    try {
      const resolvedTimezone =
        timezoneFromRequest?.length && moment.tz.zone(timezoneFromRequest)
          ? timezoneFromRequest
          : this.logger.timezone();

      const list = await this.service.shifts(
        staffId || req.jwtClaim!.obj.user_id,
        parseInt(month as string, 10),
        parseInt(year as string, 10),
        resolvedTimezone.trim()
      );

      res.setHeader('Content-Type', 'application/json').status(200).send(list);
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
      const dto = new ShiftPayload(req.body as ShiftPayload);
      await this.service.create(
        dto.checkForOverLappingSegments(
          this.logger.date(),
          this.logger.timezone()
        )
      );
      res.status(201).send({});
    } catch (e) {
      next(e);
    }
  };
}
