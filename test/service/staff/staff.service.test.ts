import { IStaffService } from '@services/staff/staff.interface.service';
import { NotFoundException } from '@exceptions/not-found.exception';
import { StaffService } from '@services/staff/staff.service';
import { DevelopmentLogger } from '@utils/log';
import { StaffEntity, StaffServiceEntity } from '@models/staff/staff.model';
import { InsertionException } from '@exceptions/insertion.exception';
import { ServiceEntity } from '@models/service/service.model';

describe('staff service', () => {
  let service: IStaffService;
  let adapters: any;

  beforeEach(() => {
    adapters = {
      staffStore: {
        staffByUUID: jest.fn()
      },
      serviceStore: {
        serviceByName: jest.fn()
      },
      staffServiceStore: {
        countByStaffIdAndServiceId: jest.fn(),
        save: jest.fn()
      }
    };
    service = new StaffService(new DevelopmentLogger(), adapters);
  });

  it(`should throw ${NotFoundException.name} when linking service to staff. staff not found`, async () => {
    // when
    adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

    // method to test & assert
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow('no staff found with id staff-uuid');
  });

  it(`should throw ${NotFoundException.name} when linking service to staff. service name not found`, async () => {
    // when
    adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
    adapters.serviceStore.serviceByName.mockResolvedValue(undefined);

    // method to test & assert
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow('no service found with name service-name');
  });

  it(`should thrown ${InsertionException.name} when linking service to staff. staff already offers service`, async () => {
    // when
    adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
    adapters.serviceStore.serviceByName.mockResolvedValue({} as ServiceEntity);
    adapters.staffServiceStore.countByStaffIdAndServiceId.mockResolvedValue(1);

    // method to test & assert
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow(InsertionException);
    await expect(
      service.linkServiceToStaff('staff-uuid', 'service-name')
    ).rejects.toThrow('staff with id staff-uuid already offers service-name');
  });

  it(`should link service to staff`, async () => {
    // when
    adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
    adapters.serviceStore.serviceByName.mockResolvedValue({} as ServiceEntity);
    adapters.staffServiceStore.countByStaffIdAndServiceId.mockResolvedValue(0);
    adapters.staffServiceStore.save.mockResolvedValue({} as StaffServiceEntity);

    // method to test & assert
    await service.linkServiceToStaff('staff-uuid', 'service-name');
    expect(adapters.staffServiceStore.save).toHaveBeenCalled();
  });
});
