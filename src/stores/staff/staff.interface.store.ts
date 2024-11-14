import { Staff } from '@models/staff/staff.model';

export interface IStaffStore {
  save(s: Staff): Promise<Staff>;
}
