import { Request, Response, Router } from 'express';
import { ILogger } from '@utils/log';
import { ServicesRegistry } from '@services/services';
import { ShiftHandler } from './shift/shift.handler';
import { ServiceHandler } from '@handlers/service/service.handler';

interface IHandlers {
  shiftHandler: ShiftHandler;
  serviceHandler: ServiceHandler;
}

export const initializeHandlers = (
  router: Router,
  logger: ILogger,
  services: ServicesRegistry
) => {
  router.get('/', welcome);
  const handlers: IHandlers = {
    shiftHandler: new ShiftHandler(router, logger, services.shiftService),
    serviceHandler: new ServiceHandler(router, logger, services.servicesOffered)
  };
  return handlers;
};

async function welcome(req: Request, res: Response): Promise<void> {
  res.status(200).send({ message: 'welcome to Landscape ERP' });
}
