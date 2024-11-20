import { IReservationService } from '@services/reservation/reservation.interface.service';
import { ReservationService } from '@services/reservation/reservation.service';
import { DevelopmentLogger } from '@utils/log';
import { NotFoundException } from '@exceptions/not-found.exception';
import { ReservationPayload } from '@models/reservation/reservation.model';
import { BadRequestException } from '@exceptions/bad-request.exception';
import { StaffEntity } from '@models/staff/staff.model';

describe('reservation service', () => {
  let service: IReservationService;
  let adapters: any;
  let mailService: any;
  let cache: any;

  beforeEach(() => {
    adapters = {
      staffStore: {
        staffByUUID: jest.fn()
      },
      staffServiceStore: {
        servicesByStaffId: jest.fn()
      },
      reservationStore: {
        save: jest.fn()
      }
    };
    mailService = {
      sendAppointmentCreation: jest.fn()
    };
    cache = {};
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
      adapters.staffServiceStore.servicesByStaffId.mockResolvedValue(
        [] as string[]
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
      adapters.staffServiceStore.servicesByStaffId.mockResolvedValue([
        'erp',
        'star'
      ]);

      // method to test & assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'no matching service(s) found for the selected staff'
      );
    });
  });
});
