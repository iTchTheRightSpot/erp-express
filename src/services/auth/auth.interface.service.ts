import { JwtClaimsObject, JwtObject, JwtResponse } from '@models/auth.model';

export interface IJwtService {
  createJwt<T extends JwtObject>(
    obj: T,
    expirationInSeconds: number
  ): Promise<JwtResponse>;
  validateJwt(token: string): Promise<JwtClaimsObject>;
}
