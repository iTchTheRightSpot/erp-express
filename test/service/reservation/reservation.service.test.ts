import { IReservationService } from '@services/reservation/reservation.interface.service';
import { ReservationService } from '@services/reservation/reservation.service';
import { DevelopmentLogger } from '@utils/log';
import { NotFoundException } from '@exceptions/not-found.exception';
import {
  AvailableTimesPayload,
  ReservationEntity,
  ReservationEnum,
  ReservationPayload,
  ServiceReservationEntity
} from '@models/reservation/reservation.model';
import { BadRequestException } from '@exceptions/bad-request.exception';
import { StaffEntity } from '@models/staff/staff.model';
import { ServiceEntity } from '@models/service/service.model';
import moment from 'moment-timezone';
import Decimal from 'decimal.js';
import { InsertionException } from '@exceptions/insertion.exception';
import { ShiftEntity } from '@models/shift/shift.model';

describe('reservation service', () => {
  let service: IReservationService;
  let adapters: any;
  let mailService: any;
  let cache: any;
  const logger = new DevelopmentLogger();

  beforeEach(() => {
    adapters = {
      staffStore: { staffByUUID: jest.fn() },
      serviceStore: { servicesByStaffId: jest.fn() },
      shiftStore: {
        countShiftsInRangeAndVisibility: jest.fn(),
        shiftsInRangeAndVisibilityAndDifference: jest.fn()
      },
      reservationStore: {
        countReservationsForStaffByTimeAndStatuses: jest.fn(),
        selectForUpdateSave: jest.fn()
      },
      txProvider: { runInTransaction: jest.fn() },
      serviceReservationStore: { save: jest.fn() }
    };
    mailService = {
      sendAppointmentCreation: jest.fn()
    };
    cache = { get: jest.fn(), put: jest.fn(), clear: jest.fn() };
    service = new ReservationService(logger, adapters, mailService, cache);
  });

  describe('creating an appointment', () => {
    it(`should throw ${NotFoundException.name} staff does not exist`, async () => {
      // given
      const dto = { staff_id: 'staff-uuid' } as ReservationPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

      // method to test & assert
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow('invalid staff id');
      expect(adapters.serviceStore.servicesByStaffId).toHaveBeenCalledTimes(0);
    });

    describe(`should throw ${BadRequestException.name} staff does not offer service`, () => {
      it('staff does not offer any service', async () => {
        // given
        const dto = {
          staff_id: 'staff-uuid',
          services: ['erp', 'star gazing']
        } as ReservationPayload;

        // when
        adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
        adapters.serviceStore.servicesByStaffId.mockResolvedValue(
          [] as ServiceEntity[]
        );

        // method to test & assert
        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        await expect(service.create(dto)).rejects.toThrow(
          'The following services were not found for the selected staff: erp, star gazing. Please check your input and try again'
        );
      });

      it(`staff does not offer one or more of the services`, async () => {
        // given
        const dto = {
          staff_id: 'staff-uuid',
          services: ['erp', 'star gazing']
        } as ReservationPayload;

        // when
        adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
        adapters.serviceStore.servicesByStaffId.mockResolvedValue([
          { name: 'erp' } as ServiceEntity,
          { name: 'rolly got me star gazing' } as ServiceEntity
        ] as ServiceEntity[]);

        // method to test & assert
        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        await expect(service.create(dto)).rejects.toThrow(
          'The following services were not found for the selected staff: star gazing. Please check your input and try again'
        );
      });
    });

    it(`should throw ${BadRequestException.name} reservation does not match staffs working hrs`, async () => {
      // given
      const dto = {
        staff_id: 'staff-uuid',
        services: ['erp']
      } as ReservationPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
      adapters.serviceStore.servicesByStaffId.mockResolvedValue([
        { name: 'erp' } as ServiceEntity
      ] as ServiceEntity[]);
      adapters.shiftStore.countShiftsInRangeAndVisibility.mockResolvedValue(0);

      // method to test & assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'invalid reservation time'
      );
    });

    it(`should throw ${BadRequestException.name} reservation that overlaps with a ${ReservationEnum.PENDING} or ${ReservationEnum.CONFIRMED} appointment`, async () => {
      // given
      const dto = {
        staff_id: 'staff-uuid',
        services: ['erp', 'star gazing'],
        time: moment().valueOf()
      } as ReservationPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
      adapters.serviceStore.servicesByStaffId.mockResolvedValue([
        { name: 'erp' } as ServiceEntity,
        { name: 'star gazing' } as ServiceEntity
      ] as ServiceEntity[]);
      adapters.shiftStore.countShiftsInRangeAndVisibility.mockResolvedValue(1);
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValue(
        3
      );

      // method to test & assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        `reservation creation failed: appointment conflicts with a ${ReservationEnum.PENDING} or ${ReservationEnum.CONFIRMED} appointment`
      );
    });

    it(`should throw ${InsertionException.name}. final check to prevent over booking`, async () => {
      // given
      const dto = {
        staff_id: 'staff-uuid',
        name: 'erp',
        email: 'erp@email.com',
        services: ['erp', 'star gazing'],
        timezone: 'America/Toronto',
        time: new Date().getTime()
      } as ReservationPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
      adapters.serviceStore.servicesByStaffId.mockResolvedValue([
        { name: 'eRp', price: new Decimal(15.96) } as ServiceEntity,
        { name: 'STar gaZiNG', price: new Decimal(25.56) } as ServiceEntity
      ] as ServiceEntity[]);
      adapters.shiftStore.countShiftsInRangeAndVisibility.mockResolvedValue(1);
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValueOnce(
        0
      );
      adapters.txProvider.runInTransaction.mockImplementation(
        async (callback: any) => {
          await callback(adapters);
        }
      );
      adapters.reservationStore.selectForUpdateSave.mockResolvedValue(
        undefined
      );
      adapters.serviceReservationStore.save.mockResolvedValue(
        {} as ServiceReservationEntity
      );
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValueOnce(
        2
      );

      // method to test
      await expect(service.create(dto)).rejects.toThrow(InsertionException);
    });

    it('success creating an appointment', async () => {
      // given
      const dto = {
        staff_id: 'staff-uuid',
        name: 'erp',
        email: 'erp@email.com',
        services: ['erp', 'star gazing'],
        timezone: 'America/Toronto',
        time: new Date().getTime()
      } as ReservationPayload;

      // when
      adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
      adapters.serviceStore.servicesByStaffId.mockResolvedValue([
        { name: 'eRp', price: new Decimal(15.96) } as ServiceEntity,
        { name: 'STar gaZiNG', price: new Decimal(25.56) } as ServiceEntity
      ] as ServiceEntity[]);
      adapters.shiftStore.countShiftsInRangeAndVisibility.mockResolvedValue(1);
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValueOnce(
        0
      );
      adapters.txProvider.runInTransaction.mockImplementation(
        async (callback: any) => await callback(adapters)
      );
      adapters.reservationStore.selectForUpdateSave.mockResolvedValue(
        {} as ReservationEntity
      );
      adapters.serviceReservationStore.save.mockResolvedValue(
        {} as ServiceReservationEntity
      );
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValueOnce(
        1
      );

      // method to test
      await service.create(dto);

      // assert
      expect(
        adapters.reservationStore.selectForUpdateSave
      ).toHaveBeenCalledTimes(1);
      expect(adapters.serviceReservationStore.save).toHaveBeenCalledTimes(2);
      expect(mailService.sendAppointmentCreation).toHaveBeenCalled();
      expect(cache.clear).toHaveBeenCalled();
    });
  });

  describe('retrieving a staffs availability', () => {
    it(`should throw ${NotFoundException.name} staff does not exist`, async () => {
      // given
      const dto = {
        staff_id: 'staff-uuid',
        services: ['erp', 'star gazing'],
        start: new Date(),
        end: new Date(),
        timezone: 'UTC'
      } as AvailableTimesPayload;

      // when
      cache.get.mockReturnValue(undefined);
      adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

      // method to test & assert
      await expect(service.reservationAvailability(dto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.reservationAvailability(dto)).rejects.toThrow(
        'invalid staff id'
      );
    });

    describe(`should throw ${BadRequestException.name} staff does not offer service`, () => {
      it('staff does not offer any service', async () => {
        // given
        const dto = {
          staff_id: 'staff-uuid',
          services: ['erp', 'star gazing'],
          start: new Date(),
          end: new Date(),
          timezone: 'UTC'
        } as AvailableTimesPayload;

        // when
        cache.get.mockReturnValue(undefined);
        adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
        adapters.serviceStore.servicesByStaffId.mockResolvedValue(
          [] as ServiceEntity[]
        );

        // method to test & assert
        await expect(service.reservationAvailability(dto)).rejects.toThrow(
          BadRequestException
        );
        await expect(service.reservationAvailability(dto)).rejects.toThrow(
          'The following services were not found for the selected staff: erp, star gazing. Please check your input and try again'
        );
      });

      it('staff does not offer one or more of the services', async () => {
        // given
        const dto = {
          staff_id: 'staff-uuid',
          services: ['erp', 'star gazing'],
          start: new Date(),
          end: new Date(),
          timezone: 'UTC'
        } as AvailableTimesPayload;

        // when
        cache.get.mockReturnValue(undefined);
        adapters.staffStore.staffByUUID.mockResolvedValue({} as StaffEntity);
        adapters.serviceStore.servicesByStaffId.mockResolvedValue([
          { name: 'erp' } as ServiceEntity
        ] as ServiceEntity[]);

        // method to test & assert
        await expect(service.reservationAvailability(dto)).rejects.toThrow(
          BadRequestException
        );
        await expect(service.reservationAvailability(dto)).rejects.toThrow(
          'The following services were not found for the selected staff: star gazing. Please check your input and try again'
        );
      });
    });

    it('should retrieve valid reservation times', async () => {
      const start = logger.date();
      start.setHours(9);
      const end = new Date(start);
      end.setHours(end.getHours() + 8);

      // given
      const dto = {
        staff_id: 'staff-uuid',
        services: ['erp'],
        start: start,
        end: end,
        timezone: 'America/Toronto'
      } as AvailableTimesPayload;

      // when
      cache.get.mockReturnValue(undefined);
      adapters.staffStore.staffByUUID.mockResolvedValue({
        staff_id: '1'
      } as StaffEntity);
      adapters.serviceStore.servicesByStaffId.mockResolvedValue([
        {
          name: 'erp',
          duration: 1800, // 30 mins
          clean_up_time: 1800, // 30 mins
          is_visible: true
        } as ServiceEntity
      ] as ServiceEntity[]);
      adapters.shiftStore.shiftsInRangeAndVisibilityAndDifference.mockResolvedValue(
        [
          {
            staff_id: '1',
            shift_start: start,
            shift_end: end,
            is_visible: true
          }
        ] as ShiftEntity[]
      );
      adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValue(
        0
      );

      // method to test
      const reservations = await service.reservationAvailability(dto);
      expect(reservations.length).toEqual(1);
      expect(reservations[0].times.length).toEqual(8);
    });
  });
});
