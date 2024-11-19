import { Request, Response, Router } from 'express';
import { ILogger } from '@utils/log';
import { ServicesRegistry } from '@services/services';
import { ShiftHandler } from './shift/shift.handler';
import { ServiceHandler } from './service/service.handler';
import { StaffHandler } from './staff/staff.handler';

interface IHandlers {
  shiftHandler: ShiftHandler;
  serviceHandler: ServiceHandler;
  staffHandler: StaffHandler;
}

export const initializeHandlers = (
  router: Router,
  logger: ILogger,
  services: ServicesRegistry
) => {
  router.get('/', welcome);
  const handlers: IHandlers = {
    shiftHandler: new ShiftHandler(router, logger, services.shiftService),
    serviceHandler: new ServiceHandler(
      router,
      logger,
      services.servicesOffered
    ),
    staffHandler: new StaffHandler(router, logger, services.staffService)
  };
  return handlers;
};

async function welcome(_req: Request, res: Response): Promise<void> {
  res.status(200).send({ message: 'welcome to Landscape ERP' });
}
