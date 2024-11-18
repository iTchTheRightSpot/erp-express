export enum RoleEnum {
  STAFF = 'STAFF',
  DEVELOPER = 'DEVELOPER',
  USER = 'USER'
}

export interface IRole {
  role_id: number;
  role: RoleEnum;
  profile_id: number;
}

export enum PermissionEnum {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE'
}

export interface IPermission {
  permission_id: number;
  permission: PermissionEnum;
  role_id: number;
}

export interface IRolePermission {
  role: RoleEnum;
  permissions: PermissionEnum[];
}
