import { IShiftService } from '@services/shift/shift.interface.service';
import { DevelopmentLogger } from '@utils/log';
import { ShiftService } from '@services/shift/shift.service';
import { NotFoundException } from '@exceptions/not-found.exception';
import {
  ISchedulePeriod,
  ShiftEntity,
  IShiftPayload,
  AllShiftsPayload
} from '@models/shift/shift.model';
import { StaffEntity } from '@models/staff/staff.model';
import { BadRequestException } from '@exceptions/bad-request.exception';

describe('shift service', () => {
  let service: IShiftService;
  let adapters: any;
  let cache: any;

  beforeEach(() => {
    adapters = {
      staffStore: {
        staffByUUID: jest.fn()
      },
      shiftStore: {
        countShiftsInRange: jest.fn(),
        save: jest.fn(),
        shiftsInRange: jest.fn()
      },
      txProvider: {
        runInTransaction: jest.fn()
      }
    };
    cache = { get: jest.fn(), put: jest.fn(), clear: jest.fn() };
    service = new ShiftService(new DevelopmentLogger(), adapters, cache);
  });

  describe('returning all shift', () => {
    it(`should throw ${NotFoundException.name} staff does not exist`, async () => {
      // given
      const obj = { staffUUID: 'staff-uuid' } as AllShiftsPayload;

      // when
      cache.get.mockReturnValue(undefined);
      adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

      // method to test & assert
      await expect(service.shifts(obj)).rejects.toThrow(NotFoundException);
      await expect(service.shifts(obj)).rejects.toThrow(
        `no staff with id ${obj.staffUUID}`
      );
    });

    it('should return all shifts', async () => {
      // given
      const obj = {
        staffUUID: 'staff-uuid',
        month: 1,
        year: 2024,
        timezone: 'UTC'
      } as AllShiftsPayload;

      // when
      cache.get.mockReturnValue(undefined);
      adapters.staffStore.staffByUUID.mockResolvedValue({
        staff_id: '1'
      } as StaffEntity);
      adapters.shiftStore.shiftsInRange.mockResolvedValue([] as ShiftEntity[]);

      // method to test & assert
      await service.shifts(obj);
      expect(cache.put).toHaveBeenCalled();
    });
  });

  describe('saving shift', () => {
    it(`should throw ${NotFoundException.name} staff does not exist`, async () => {
      // given
      const obj = { staffId: 'staff-uuid' } as IShiftPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

      // method to test & assert
      await expect(service.create(obj)).rejects.toThrow(NotFoundException);
      await expect(service.create(obj)).rejects.toThrow(
        `staff with id ${obj.staffId} not found`
      );
    });

    it(`should throw ${BadRequestException.name} duplicate date & time`, async () => {
      // given
      const dto = {
        staffId: 'staff-uuid',
        times: [{ start: new Date(), end: new Date() }] as ISchedulePeriod[]
      } as IShiftPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({
        staff_id: '1'
      } as StaffEntity);
      adapters.shiftStore.countShiftsInRange.mockResolvedValue(1);

      // method to test & assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        `conflicting schedule ${dto.times[0].start}`
      );
    });

    it('success', async () => {
      // given
      const dto = {
        staffId: 'staff-uuid',
        times: [
          {
            start: new Date(),
            end: new Date(),
            isVisible: true,
            isReoccurring: false
          }
        ] as ISchedulePeriod[]
      } as IShiftPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({
        staff_id: '1'
      } as StaffEntity);
      adapters.shiftStore.countShiftsInRange.mockResolvedValue(0);
      adapters.txProvider.runInTransaction.mockImplementation(
        async (callback: any) => await callback(adapters)
      );
      adapters.shiftStore.save.mockResolvedValue({} as ShiftEntity);

      // method to test
      await service.create(dto);

      // assert
      expect(adapters.shiftStore.save).toHaveBeenCalledTimes(1);
      expect(cache.clear).toHaveBeenCalled();
    });
  });
});
