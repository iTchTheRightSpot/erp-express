import { IShift } from '@models/shift/shift.model';

export interface IShiftStore {
  save(s: IShift): Promise<IShift>;
  countShiftsInRange(staffId: number, start: Date, end: Date): Promise<number>;
  shiftsInRange(staffId: number, start: Date, end: Date): Promise<IShift[]>;
}
