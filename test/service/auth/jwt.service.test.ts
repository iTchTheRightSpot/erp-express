import { JwtService } from '@services/auth/auth.service';
import { DevelopmentLogger } from '@utils/log';
import { twoDaysInSeconds } from '@utils/util';
import { StaffJwt } from '@models/auth.model';
import { RoleEnum } from '@models/role.model';

describe('jwtService', () => {
  const service = new JwtService(new DevelopmentLogger());

  it('should create jwt and decoded', async () => {
    // given
    const obj: StaffJwt = {
      staff_uuid: 'staff-uuid',
      roles: [RoleEnum.STAFF, RoleEnum.DEVELOPER, RoleEnum.USER]
    };

    // method to test & assert
    const res = await service.createJwt(obj, twoDaysInSeconds);
    expect(res).toBeDefined();
    expect(res.jwt.length).toBeGreaterThan(10);

    // method to test & assert
    const decoded = await service.validateJwt(res.jwt);
    expect(decoded.obj).toEqual(obj);
  });
});
