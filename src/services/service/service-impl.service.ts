import { IServiceOffered } from './service.interface.service';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import { ServicePayload } from '@models/service/service.model';

export class ServiceOfferedImpl implements IServiceOffered {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly cache: ICache<string, {}>
  ) {}

  create(p: ServicePayload): Promise<void> {
    this.logger.log(`${ServiceOfferedImpl.name} called`);
    return Promise.resolve();
  }
}
