import { IStaff } from '@models/staff/staff.model';

export interface IStaffStore {
  save(s: IStaff): Promise<IStaff>;
  staffByUUID(uuid: string): Promise<IStaff | undefined>;
}
