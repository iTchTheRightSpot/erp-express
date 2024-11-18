import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { ILogger } from '@utils/log';
import { IShiftService } from '@services/shift/shift.interface.service';
import { middleware } from '@middlewares/chain.middleware';
import {
  checkForOverLappingSegments,
  ShiftPayload
} from '@models/shift/shift.model';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';

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

    this.router.post(
      '/shift',
      middleware.hasRoleAndPermissions(this.logger, rp),
      middleware.requestBody(this.logger, ShiftPayload),
      this.create
    );
  };

  private readonly create: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const b = req.body as ShiftPayload;

      await this.service.create(
        checkForOverLappingSegments(
          b,
          this.logger.date(),
          this.logger.timezone().tz()!!
        )
      );
      res.status(201).send({});
    } catch (e) {
      next(e);
    }
  };
}
