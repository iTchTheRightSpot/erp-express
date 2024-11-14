import { RoleEnum } from './role.model';

export interface JwtObject {
  roles: RoleEnum[];
}

export interface StaffJwt extends JwtObject {
  staff_id: string;
}

export interface UserJwt extends JwtObject {
  user_id: string;
}

export interface JwtClaimsObject {
  obj: JwtObject;
  iss: string;
  iat: number;
  exp: number;
}

export interface JwtResponse {
  jwt: string;
  exp: Date;
}
