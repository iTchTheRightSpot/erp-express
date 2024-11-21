import { ReservationStore } from '@stores/reservation/reservation.store';
import { ServiceReservationStore } from '@stores/reservation/service-reservation.store';
import { Pool, PoolClient } from 'pg';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import {
  IReservationStore,
  IServiceReservationStore
} from '@stores/reservation/reservation.interface.store';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { StaffEntity } from '@models/staff/staff.model';
import { StaffStore } from '@stores/staff/staff.store';
import { IServiceStore } from '@stores/service/service.interface.store';
import { ServiceEntity } from '@models/service/service.model';
import { ServiceStore } from '@stores/service/service.store';
import {
  ReservationEntity,
  ReservationEnum,
  ServiceReservationEntity
} from '@models/reservation/reservation.model';

describe(`${ReservationStore.name} && ${ServiceReservationStore.name} test`, () => {
  let pool: Pool;
  let client: PoolClient;
  const logger = new DevelopmentLogger();
  let reservationStore: IReservationStore;
  let serviceReservationStore: IServiceReservationStore;
  let staffStore: IStaffStore;
  let staff: StaffEntity;
  let serviceStore: IServiceStore;
  let serviceObj: ServiceEntity;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    reservationStore = new ReservationStore(logger, db);
    serviceReservationStore = new ServiceReservationStore(logger, db);
    staffStore = new StaffStore(logger, db);
    serviceStore = new ServiceStore(logger, db);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    staff = await staffStore.save({} as StaffEntity);
    serviceObj = await serviceStore.save({
      name: 'erp',
      price: '65.44',
      duration: 3600,
      clean_up_time: 60 * 30
    } as ServiceEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should save reservation && service_reservation && count reservations for staff by time & statuses', async () => {
    const expireAt = new Date();
    expireAt.setSeconds(expireAt.getSeconds() + 3600);

    // method to test
    const reservation = await reservationStore.save({
      staff_id: staff.staff_id,
      name: 'erp user',
      email: 'erp@email.com',
      price: '65.44',
      status: ReservationEnum.CANCELLED,
      created_at: logger.date(),
      scheduled_for: logger.date(),
      expire_at: expireAt
    } as ReservationEntity);

    // assert
    expect(Number(reservation.reservation_id)).toBeGreaterThan(0);

    // method to test
    const serRes = await serviceReservationStore.save({
      reservation_id: reservation.reservation_id,
      service_id: serviceObj.service_id
    } as ServiceReservationEntity);

    // assert
    expect(Number(serRes.junction_id)).toBeGreaterThan(0);

    // method to test & assert
    let count =
      await reservationStore.countReservationsForStaffByTimeAndStatuses(
        staff.staff_id,
        logger.date(),
        expireAt,
        ReservationEnum.PENDING
      );

    expect(count).toEqual(0);

    count = await reservationStore.countReservationsForStaffByTimeAndStatuses(
      staff.staff_id,
      logger.date(),
      expireAt,
      ReservationEnum.PENDING,
      ReservationEnum.CANCELLED
    );

    expect(count).toEqual(1);

    count = await reservationStore.countReservationsForStaffByTimeAndStatuses(
      staff.staff_id,
      logger.date(),
      expireAt,
      ReservationEnum.CONFIRMED,
      ReservationEnum.PENDING,
      ReservationEnum.CANCELLED
    );

    expect(count).toEqual(1);
  });
});
