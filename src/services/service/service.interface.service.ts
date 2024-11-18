import { ServicePayload } from '@models/service/service.model';

export interface IServiceOffered {
  create(p: ServicePayload): Promise<void>;
}
