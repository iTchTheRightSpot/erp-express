import { Request, Response, Router } from 'express';
import { ILogger } from '@utils/log';
import { IServices } from '@services/services';
import { ShiftHandler } from './shift/shift.handler';

interface IHandlers {
  shiftHandler: ShiftHandler;
}

export const initializeHandlers = (
  router: Router,
  logger: ILogger,
  services: IServices
) => {
  router.get('/', welcome);
  const handlers: IHandlers = {
    shiftHandler: new ShiftHandler(router, logger, services.shiftService)
  };
  return handlers;
};

async function welcome(req: Request, res: Response): Promise<void> {
  res.status(200).send({ message: 'welcome to Landscape ERP api' });
}
