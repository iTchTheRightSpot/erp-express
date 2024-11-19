import { ServiceEntity } from '@models/service/service.model';

export interface IServiceStore {
  save(s: ServiceEntity): Promise<ServiceEntity>;
  serviceByName(name: string): Promise<ServiceEntity | undefined>;
}
