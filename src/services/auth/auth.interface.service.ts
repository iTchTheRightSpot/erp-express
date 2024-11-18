import { IJwtClaimsObject, IJwtObject, IJwtResponse } from '@models/auth.model';

export interface IJwtService {
  createJwt(
    obj: IJwtObject,
    expirationInSeconds: number
  ): Promise<IJwtResponse>;
  validateJwt(token: string): Promise<IJwtClaimsObject>;
}
