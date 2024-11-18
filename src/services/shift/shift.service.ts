import { IShiftService } from './shift.interface.service';
import { ISchedulePeriod } from '@models/shift/shift.model';

export class ShiftService implements IShiftService {
  constructor() {}

  create(dto: ISchedulePeriod): Promise<void> {
    return Promise.resolve();
  }
}
