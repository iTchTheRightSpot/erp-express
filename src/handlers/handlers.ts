import { Request, Response, Router } from 'express';
import { ILogger } from '@utils/log';
import { IServices } from '@services/services';

interface IHandlers {}

export const initializeHandlers = (
  router: Router,
  logger: ILogger,
  services: IServices
) => {
  router.get('/', welcome);
  const handlers: IHandlers = {};
  return handlers;
};

async function welcome(req: Request, res: Response): Promise<void> {
  res.status(200).send({ message: 'welcome to Landscape MRP api' });
}
