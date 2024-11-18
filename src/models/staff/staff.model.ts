export interface IStaff {
  staff_id: number;
  uuid: string;
  bio: string | null;
  profile_id: number | null;
}

export interface StaffServiceEntity {
  junction_id: number;
  staff_id: number;
  service_id: number;
}
