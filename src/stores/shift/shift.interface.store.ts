import { ShiftEntity } from '@models/shift/shift.model';

export interface IShiftStore {
  save(s: ShiftEntity): Promise<ShiftEntity>;
  countShiftsInRange(staffId: number, start: Date, end: Date): Promise<number>;
  shiftsInRange(
    staffId: number,
    start: Date,
    end: Date
  ): Promise<ShiftEntity[]>;
}
