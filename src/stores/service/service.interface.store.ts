import { IService } from '@models/service/service.model';

export interface IServiceStore {
  save(s: IService): Promise<IService>;
}
