import { IStaff, StaffServiceEntity } from '@models/staff/staff.model';

export interface IStaffStore {
  save(s: IStaff): Promise<IStaff>;
  staffByUUID(uuid: string): Promise<IStaff | undefined>;
}

export interface IStaffServiceStore {
  save(s: StaffServiceEntity): Promise<StaffServiceEntity>;
  countByStaffIdAndServiceId(
    staffId: number,
    serviceId: number
  ): Promise<number>;
}
