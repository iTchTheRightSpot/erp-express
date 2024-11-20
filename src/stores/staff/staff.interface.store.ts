import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';

export interface IStaffStore {
  save(s: StaffEntity): Promise<StaffEntity>;
  staffByUUID(uuid: string): Promise<StaffEntity | undefined>;
}

export interface IStaffServiceStore {
  save(s: StaffServiceEntity): Promise<StaffServiceEntity>;
  countByStaffIdAndServiceId(
    staffId: number,
    serviceId: number
  ): Promise<number>;
}
