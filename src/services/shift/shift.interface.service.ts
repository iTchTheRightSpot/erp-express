import { IShiftPayload, IShiftResponse } from '@models/shift/shift.model';

export interface IShiftService {
  create(dto: IShiftPayload): Promise<void>;
  shifts(
    staffUUID: string,
    month: number,
    year: number,
    timezone: string
  ): Promise<IShiftResponse[]>;
}
