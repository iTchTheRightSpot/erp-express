import { IJwtService } from '@services/auth/auth.interface.service';
import { ILogger } from '@utils/log';
import { JwtClaimsObject, JwtObject, JwtResponse } from '@models/auth.model';
import * as jwt from 'jsonwebtoken';
import { env } from '@utils/env';
import { UnauthorizedException } from '@exceptions/unauthorized.exception';

export class JwtService implements IJwtService {
  constructor(private readonly logger: ILogger) {}

  async createJwt<T extends JwtObject>(
    obj: T,
    expirationInSeconds: number
  ): Promise<JwtResponse> {
    const date = this.logger.date();
    const expireAt = new Date(date);
    expireAt.setSeconds(date.getSeconds() + expirationInSeconds);

    const claims: JwtClaimsObject<T> = {
      obj: obj,
      iss: 'Landscape MRP',
      iat: Math.floor(date.getTime() / 1000), // convert to epoch seconds. Look at official docs for ref. (README)
      exp: Math.floor(expireAt.getTime() / 1000)
    };

    const token = jwt.sign(claims, env.JWT_PRIV_KEY, { algorithm: 'RS256' });

    return { jwt: token, exp: expireAt };
  }

  async validateJwt<T extends JwtObject>(
    token: string
  ): Promise<JwtClaimsObject<T>> {
    try {
      const obj = await jwt.verify(token, env.JWT_PUB_KEY);
      return obj as JwtClaimsObject<T>;
    } catch (e) {
      this.logger.error(`${JwtService.name} ${e}`);
      throw new UnauthorizedException('');
    }
  }
}
