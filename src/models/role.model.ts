export enum RoleEnum {
  STAFF = 'STAFF',
  DEVELOPER = 'DEVELOPER',
  USER = 'USER'
}

export interface Role {
  role_id: number;
  role: RoleEnum;
  profile_id: number;
}
