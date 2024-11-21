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
import { AllShiftsPayload, ShiftPayload } from '@models/shift/shift.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { isInvalidateMonthYear, resolveTimezone } from '@handlers/util.handler';

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

  private readonly shifts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { staff_id, month, year, timezone } = req.query;

    const staffId = staff_id as string | undefined;

    try {
      const obj = isInvalidateMonthYear(month, year);
      const resolvedTimezone = resolveTimezone(
        timezone,
        this.logger.timezone()
      );
      const payload: AllShiftsPayload = {
        staffUUID: staffId || req.jwtClaim!.obj.user_id,
        month: obj.month,
        year: obj.year,
        timezone: resolvedTimezone.trim()
      };

      const list = await this.service.shifts(payload);

      res.setHeader('Content-Type', 'application/json').status(200).send(list);
    } catch (e) {
      this.logger.log(`${ShiftHandler.name} all shifts err: ${e}`);
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
