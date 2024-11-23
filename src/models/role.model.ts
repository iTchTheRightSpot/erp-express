export enum RoleEnum {
  STAFF = 'STAFF',
  DEVELOPER = 'DEVELOPER',
  USER = 'USER'
}

export interface RoleEntity {
  role_id: string;
  role: RoleEnum;
  profile_id: string;
}

export enum PermissionEnum {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE'
}

export interface PermissionEntity {
  permission_id: string;
  permission: PermissionEnum;
  role_id: string;
}

export interface IRolePermission {
  role: RoleEnum;
  permissions: PermissionEnum[];
}
