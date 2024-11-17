import { JwtClaimsObject, JwtObject, JwtResponse } from '@models/auth.model';

export interface IJwtService {
  createJwt(
    obj: JwtObject,
    expirationInSeconds: number
  ): Promise<JwtResponse>;
  validateJwt(token: string): Promise<JwtClaimsObject>;
}
