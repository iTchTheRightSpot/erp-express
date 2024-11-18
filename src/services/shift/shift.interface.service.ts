import { ISchedulePeriod } from '@models/shift/shift.model';

export interface IShiftService {
  create(dto: ISchedulePeriod): Promise<void>;
}
