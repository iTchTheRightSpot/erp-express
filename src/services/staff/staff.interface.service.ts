export interface IStaffService {
  linkServiceToStaff(staffUUID: string, service: string): Promise<void>;
}
