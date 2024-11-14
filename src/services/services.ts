import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';

export interface IServices {}

export const initializeServices = (log: ILogger, ads: Adapters): IServices => {
  return {};
};
