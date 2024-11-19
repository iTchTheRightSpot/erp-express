import { ServicePayload } from '@models/service/service.model';

export interface IService {
  create(p: ServicePayload): Promise<void>;
}
