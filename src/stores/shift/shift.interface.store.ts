import { IShift } from '@models/shift/shift.model';

export interface IShiftStore {
  save(s: IShift): Promise<IShift>;
  countExistingShiftsForStaff(
    staffId: number,
    start: Date,
    end: Date
  ): Promise<number>;
}
