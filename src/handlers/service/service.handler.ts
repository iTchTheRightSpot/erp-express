import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { ILogger } from '@utils/log';
import { IServiceOffered } from '@services/service/service.interface.service';
import { IRolePermission, PermissionEnum, RoleEnum } from '@models/role.model';
import { middleware } from '@middlewares/chain.middleware';
import { ServicePayload } from '@models/service/service.model';

export class ServiceHandler {
  constructor(
    private readonly router: Router,
    private readonly logger: ILogger,
    private readonly service: IServiceOffered
  ) {
    this.register();
  }

  private readonly register = () => {
    const rp: IRolePermission = {
      role: RoleEnum.STAFF,
      permissions: [PermissionEnum.WRITE]
    };

    this.router.post(
      '/service',
      middleware.hasRoleAndPermissions(this.logger, rp),
      middleware.requestBody(this.logger, ServicePayload),
      this.create
    );
  };

  private readonly create: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.create(req.body as ServicePayload);
      res.status(201).send({});
    } catch (e) {
      next(e);
    }
  };
}
