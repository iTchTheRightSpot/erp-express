import { IJwtService } from '@services/auth/auth.interface.service';
import { ILogger } from '@utils/log';
import { JwtClaimsObject, JwtObject, JwtResponse } from '@models/auth.model';
import * as jwt from 'jsonwebtoken';
import { env } from '@utils/env';
import { UnauthorizedException } from '@exceptions/unauthorized.exception';

export class JwtService implements IJwtService {
  constructor(private readonly logger: ILogger) {}

  async createJwt(
    obj: JwtObject,
    expirationInSeconds: number
  ): Promise<JwtResponse> {
    const date = this.logger.date();
    const expireAt = new Date(date);
    expireAt.setSeconds(date.getSeconds() + expirationInSeconds);

    const claims: JwtClaimsObject = {
      obj: obj,
      iss: 'Landscape ERP',
      iat: Math.floor(date.getTime() / 1000), // convert to epoch seconds. Look at official docs for ref. (README)
      exp: Math.floor(expireAt.getTime() / 1000)
    };

    const token = jwt.sign(claims, env.JWT_PRIV_KEY, { algorithm: 'RS256' });

    return { token: token, exp: expireAt };
  }

  async validateJwt(
    token: string
  ): Promise<JwtClaimsObject> {
    try {
      const obj = await jwt.verify(token, env.JWT_PUB_KEY);
      return obj as JwtClaimsObject;
    } catch (e) {
      this.logger.error(`${JwtService.name} ${e}`);
      throw new UnauthorizedException('');
    }
  }
}
