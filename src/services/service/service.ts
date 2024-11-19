import { IService } from './service.interface';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import { ServiceEntity, ServicePayload } from '@models/service/service.model';
import { InsertionException } from '@exceptions/insertion.exception';

export class ServiceImpl implements IService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly cache: ICache<string, {}>
  ) {}

  async create(p: ServicePayload): Promise<void> {
    try {
      await this.adapters.serviceStore.save({
        name: p.name,
        price: p.price.trim(),
        is_visible: p.is_visible,
        duration: p.duration,
        clean_up_time: p.clean_up_time
      } as ServiceEntity);
      this.cache.clear();
    } catch (e) {
      throw new InsertionException(`error saving ${p.name}`);
    }
  }
}
