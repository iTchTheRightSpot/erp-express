import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { IJwtService } from './auth/auth.interface.service';
import { JwtService } from './auth/auth.service';
import { IShiftService } from './shift/shift.interface.service';
import { ShiftService } from './shift/shift.service';
import { InMemoryCache } from '@utils/cache';
import { IServiceOffered } from './service/service.interface.service';
import { ServiceOfferedImpl } from './service/service-impl.service';

export interface ServicesRegistry {
  jwtService: IJwtService;
  shiftService: IShiftService;
  servicesOffered: IServiceOffered;
}

export const initializeServices = (
  log: ILogger,
  ads: Adapters
): ServicesRegistry => {
  return {
    jwtService: new JwtService(log),
    shiftService: new ShiftService(log, ads, new InMemoryCache(30, 20)),
    servicesOffered: new ServiceOfferedImpl(log, ads, new InMemoryCache(30, 20))
  };
};
