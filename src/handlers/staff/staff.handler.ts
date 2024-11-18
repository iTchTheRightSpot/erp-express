import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { ILogger } from '@utils/log';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { middleware } from '@middlewares/chain.middleware';
import { IStaffService } from '@services/staff/staff.interface.service';

export class StaffHandler {
  constructor(
    private readonly router: Router,
    private readonly logger: ILogger,
    private readonly service: IStaffService
  ) {
    this.register();
  }

  private readonly register = () => {
    const rp: IRolePermission = {
      role: RoleEnum.STAFF,
      permissions: [PermissionEnum.WRITE]
    };

    this.router.post(
      '/staff/service',
      middleware.hasRoleAndPermissions(this.logger, rp),
      this.linkServiceToStaff
    );
  };

  private readonly linkServiceToStaff: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { staff_id, service_name } = req.query;
    const staffId = staff_id as string | undefined;
    const name = service_name as string | undefined;

    if (!staffId || !name) {
      this.logger.error(`invalid staff_id ${staffId} or service_name ${name}`);
      res.setHeader('Content-Type', 'application/json').status(400).send({
        status: 400,
        message: 'staff_id and service_name are required'
      });
      return;
    }

    try {
      await this.service.linkServiceToStaff(staffId, name);
      res.status(201).send({});
    } catch (e) {
      next(e);
    }
  };
}
