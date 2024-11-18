import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { IJwtService } from './auth/auth.interface.service';
import { JwtService } from './auth/auth.service';
import { IShiftService } from './shift/shift.interface.service';
import { ShiftService } from './shift/shift.service';
import { InMemoryCache } from '@utils/cache';
import { IService } from './service/service.interface';
import { ServiceImpl } from './service/service';

export interface ServicesRegistry {
  jwtService: IJwtService;
  shiftService: IShiftService;
  servicesOffered: IService;
}

export const initializeServices = (
  log: ILogger,
  ads: Adapters
): ServicesRegistry => {
  return {
    jwtService: new JwtService(log),
    shiftService: new ShiftService(log, ads, new InMemoryCache(30, 20)),
    servicesOffered: new ServiceImpl(log, ads, new InMemoryCache(30, 20))
  };
};
