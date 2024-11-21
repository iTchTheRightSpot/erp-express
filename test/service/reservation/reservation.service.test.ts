import { IReservationService } from '@services/reservation/reservation.interface.service';
import { ReservationService } from '@services/reservation/reservation.service';
import { DevelopmentLogger } from '@utils/log';
import { NotFoundException } from '@exceptions/not-found.exception';
import {
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

describe('reservation service', () => {
  let service: IReservationService;
  let adapters: any;
  let mailService: any;
  let cache: any;

  beforeEach(() => {
    adapters = {
      staffStore: { staffByUUID: jest.fn() },
      serviceStore: { servicesByStaffId: jest.fn() },
      reservationStore: {
        countReservationsForStaffByTimeAndStatuses: jest.fn(),
        save: jest.fn()
      },
      txProvider: { runInTransaction: jest.fn() },
      serviceReservationStore: { save: jest.fn() }
    };
    mailService = {
      sendAppointmentCreation: jest.fn()
    };
    cache = { clear: jest.fn() };
    service = new ReservationService(
      new DevelopmentLogger(),
      adapters,
      mailService,
      cache
    );
  });

  it(`should throw ${NotFoundException.name} when creating a reservation. staff does not exist`, async () => {
    // given
    const dto = { staff_id: 'staff-uuid' } as ReservationPayload;

    // when
    adapters.staffStore.staffByUUID.mockResolvedValue(undefined);

    // method to test & assert
    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    await expect(service.create(dto)).rejects.toThrow('invalid staff id');
    expect(adapters.reservationStore.save).toHaveBeenCalledTimes(0);
  });

  describe(`should throw ${BadRequestException.name} when creating a reservation. staff does not offer service`, () => {
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
        'no matching service(s) found for the selected staff'
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
        'no matching service(s) found for the selected staff'
      );
    });
  });

  it(`should throw ${BadRequestException.name} when creating a reservation that overlaps with a ${ReservationEnum.PENDING} or ${ReservationEnum.CONFIRMED} appointment`, async () => {
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
    adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValue(
      3
    );

    // method to test & assert
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    await expect(service.create(dto)).rejects.toThrow(
      `reservation creation failed: appointment conflicts with a ${ReservationEnum.PENDING} or ${ReservationEnum.CONFIRMED} appointment`
    );
  });

  it('should create new appointment', async () => {
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
    adapters.reservationStore.countReservationsForStaffByTimeAndStatuses.mockResolvedValue(
      0
    );
    adapters.txProvider.runInTransaction.mockImplementation(
      async (callback: any) => await callback(adapters)
    );
    adapters.reservationStore.save.mockResolvedValue({} as ReservationEntity);
    adapters.serviceReservationStore.save.mockResolvedValue(
      {} as ServiceReservationEntity
    );

    // method to test
    await service.create(dto);

    // assert
    expect(adapters.reservationStore.save).toHaveBeenCalledTimes(1);
    expect(adapters.serviceReservationStore.save).toHaveBeenCalledTimes(2);
    expect(mailService.sendAppointmentCreation).toHaveBeenCalled();
    expect(cache.clear).toHaveBeenCalled();
  });
});
