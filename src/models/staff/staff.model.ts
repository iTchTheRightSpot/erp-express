export interface StaffEntity {
  staff_id: string;
  uuid: string;
  bio: string | null;
  profile_id: string | null;
}

export interface StaffServiceEntity {
  junction_id: string;
  staff_id: string;
  service_id: string;
}
