import { Staff } from '@models/staff/staff.model';

export interface IStaffStore {
  save(s: Staff): Promise<Staff>;
  staffByUUID(uuid: string): Promise<Staff | undefined>
}
