import {
  AllShiftsPayload,
  IShiftPayload,
  IShiftResponse
} from '@models/shift/shift.model';

export interface IShiftService {
  create(dto: IShiftPayload): Promise<void>;
  shifts(obj: AllShiftsPayload): Promise<IShiftResponse[]>;
}
