import { ShiftEntity } from '@models/shift/shift.model';

export interface IShiftStore {
  save(s: ShiftEntity): Promise<ShiftEntity>;
  countShiftsInRange(staffId: string, start: Date, end: Date): Promise<number>;
  countShiftsInRangeAndVisibility(
    staffId: string,
    start: Date,
    end: Date,
    isVisible: boolean
  ): Promise<number>;
  shiftsInRange(
    staffId: string,
    start: Date,
    end: Date
  ): Promise<ShiftEntity[]>;
  shiftsInRangeAndVisibilityAndDifference(
    staffId: string,
    start: Date,
    end: Date,
    isVisible: boolean,
    seconds: number
  ): Promise<ShiftEntity[]>;
}
