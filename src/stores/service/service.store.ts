import { IServiceStore } from './service.interface.store';
import { IService } from '@models/service/service.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class ServiceStore implements IServiceStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: IService): Promise<IService> {
    return Promise.resolve({} as IService);
  }
}
