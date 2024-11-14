import { RoleEnum } from './role.model';

export interface JwtObject {
  roles: RoleEnum[];
}

export interface StaffJwt extends JwtObject {
  staff_uuid: string;
}

export interface UserJwt extends JwtObject {
  user_uuid: string;
}

export interface JwtClaimsObject<T extends JwtObject> {
  obj: T;
  iss: string;
  iat: number;
  exp: number;
}

export interface JwtResponse {
  jwt: string;
  exp: Date;
}
