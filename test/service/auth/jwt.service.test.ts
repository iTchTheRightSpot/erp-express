import { JwtService } from '@services/auth/auth.service';
import { DevelopmentLogger } from '@utils/log';
import { twoDaysInSeconds } from '@utils/util';
import { PermissionEnum, RoleEnum, IRolePermission } from '@models/role.model';
import { IJwtObject } from '@models/auth.model';

describe('jwtService', () => {
  const service = new JwtService(new DevelopmentLogger());

  it('should create jwt and decoded', async () => {
    // given
    const obj = {
      user_id: '0b2af07b-07dd-46ba-99f4-5ceab2499979',
      access_controls: [
        { role: RoleEnum.STAFF, permissions: [PermissionEnum.WRITE] },
        {
          role: RoleEnum.DEVELOPER,
          permissions: [PermissionEnum.WRITE, PermissionEnum.DELETE]
        },
        { role: RoleEnum.USER, permissions: [PermissionEnum.READ] }
      ] as IRolePermission[]
    } as IJwtObject;

    // method to test & assert
    const res = await service.createJwt(obj, twoDaysInSeconds);
    expect(res).toBeDefined();
    expect(res.token.length).toBeGreaterThan(10);

    // method to test & assert
    const decoded = await service.validateJwt(res.token);
    expect(decoded.obj).toEqual(obj);
  });
});
