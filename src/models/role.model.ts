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

export enum PermissionEnum {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE'
}

export interface Permission {
  permission_id: number;
  permission: PermissionEnum;
  role_id: number;
}

export interface RolePermission {
  role: RoleEnum;
  permissions: PermissionEnum[];
}
