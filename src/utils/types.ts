import { IJwtClaimsObject } from '@models/auth.model';

declare global {
  namespace Express {
    interface Request {
      jwtClaim?: IJwtClaimsObject;
    }
  }
}
