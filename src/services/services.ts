import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { IJwtService } from './auth/auth.interface.service';
import { JwtService } from './auth/auth.service';
import { IShiftService } from './shift/shift.interface.service';
import { ShiftService } from './shift/shift.service';
import { InMemoryCache } from '@utils/cache';

export interface IServices {
  jwtService: IJwtService;
  shiftService: IShiftService;
}

export const initializeServices = (log: ILogger, ads: Adapters): IServices => {
  return {
    jwtService: new JwtService(log),
    shiftService: new ShiftService(log, ads, new InMemoryCache(30, 20))
  };
};
