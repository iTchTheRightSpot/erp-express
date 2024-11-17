import { RolePermission } from './role.model';

export interface JwtObject {
  user_id: string;
  access_controls: RolePermission[];
}

export interface JwtClaimsObject {
  obj: JwtObject;
  iss: string;
  iat: number;
  exp: number;
}

export interface JwtResponse {
  token: string;
  exp: Date;
}
