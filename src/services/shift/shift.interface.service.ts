import { IShiftPayload } from '@models/shift/shift.model';

export interface IShiftService {
  create(dto: IShiftPayload): Promise<void>;
}
