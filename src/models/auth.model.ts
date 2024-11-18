import { IRolePermission } from './role.model';

export interface IJwtObject {
  user_id: string;
  access_controls: IRolePermission[];
}

export interface IJwtClaimsObject {
  obj: IJwtObject;
  iss: string;
  iat: number;
  exp: number;
}

export interface IJwtResponse {
  token: string;
  exp: Date;
}
