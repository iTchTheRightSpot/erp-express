import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { IJwtService } from '@services/auth/auth.interface.service';
import { JwtService } from '@services/auth/auth.service';

export interface IServices {
  jwtService: IJwtService;
}

export const initializeServices = (log: ILogger, ads: Adapters): IServices => {
  return {
    jwtService: new JwtService(log)
  };
};
