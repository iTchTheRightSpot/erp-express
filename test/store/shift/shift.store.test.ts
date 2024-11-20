import { Pool, PoolClient } from 'pg';
import { IStaffStore } from '@stores/staff/staff.interface.store';
import { poolInstance } from '@mock/pool';
import { DevelopmentLogger } from '@utils/log';
import { MockLiveDatabaseClient } from '@mock/db-client';
import { StaffStore } from '@stores/staff/staff.store';
import { IShiftStore } from '@stores/shift/shift.interface.store';
import { StaffEntity } from '@models/staff/staff.model';
import { ShiftStore } from '@stores/shift/shift.store';
import { ShiftEntity } from '@models/shift/shift.model';

describe('shift store', () => {
  const logger = new DevelopmentLogger();
  let pool: Pool;
  let client: PoolClient;
  let staff: StaffEntity;
  let staffStore: IStaffStore;
  let shiftStore: IShiftStore;

  beforeAll(async () => {
    pool = poolInstance();
    client = await pool.connect();
    const db = new MockLiveDatabaseClient(client);
    staffStore = new StaffStore(logger, db);
    shiftStore = new ShiftStore(logger, db);
  });

  beforeEach(async () => {
    await client.query('BEGIN');
    staff = await staffStore.save({} as StaffEntity);
  });

  afterEach(async () => await client.query('ROLLBACK'));

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it('should save shift', async () => {
    // give
    const shift = {
      staff_id: staff.staff_id,
      shift_start: logger.date(),
      shift_end: logger.date()
    } as ShiftEntity;

    // method to test
    const save = await shiftStore.save(shift);

    // assert
    expect(save.shift_id).toBeGreaterThan(0);
  });

  it('staff shift count should be equal to 2', async () => {
    // given
    const end = new Date(logger.date());
    end.setSeconds(end.getSeconds() + 3600); // 1 hr in seconds

    const shift = {
      staff_id: staff.staff_id,
      shift_start: logger.date(),
      shift_end: end
    } as ShiftEntity;

    await shiftStore.save(shift);

    const d = logger.date();
    d.setSeconds(d.getSeconds(), 30 * 60); // add 30 mins in seconds

    shift.shift_start = d;
    await shiftStore.save(shift);

    // method to test
    const count = await shiftStore.countShiftsInRange(
      staff.staff_id,
      logger.date(),
      end
    );

    // assert
    expect(count).toEqual(2);
  });

  it('staff shift count should be 0', async () => {
    // given
    const end = new Date(logger.date());
    end.setSeconds(end.getSeconds() + 3600);

    const shift = {
      staff_id: staff.staff_id,
      shift_start: logger.date(),
      shift_end: end
    } as ShiftEntity;

    await shiftStore.save(shift);

    end.setSeconds(end.getSeconds() + 1);

    const newEnd = new Date(end);
    newEnd.setSeconds(end.getSeconds() + 1);

    // method to test
    const count = await shiftStore.countShiftsInRange(
      staff.staff_id,
      end,
      newEnd
    );

    // assert
    expect(count).toEqual(0);
  });

  it('staff shift count should be 0. staff not found', async () => {
    // method to test
    const count = await shiftStore.countShiftsInRange(
      -1,
      new Date(),
      new Date()
    );

    // assert
    expect(count).toEqual(0);
  });

  it('should return shifts in range', async () => {
    // given
    const m: Promise<ShiftEntity>[] = [];

    for (let i = 0; i < 10; i++) {
      const start = new Date(2024, 1, i + 1);
      const end = new Date(start);
      m[i] = shiftStore.save({
        staff_id: staff.staff_id,
        shift_start: start,
        shift_end: end
      } as ShiftEntity);
    }

    // save in parallel
    await Promise.all(m);

    // method to test
    const all = await shiftStore.shiftsInRange(
      staff.staff_id,
      new Date(2024, 1, 1),
      new Date(2024, 1, 30)
    );

    // assert
    expect(all.length).toEqual(10);
  });

  it('should return no shifts in range. date in the past', async () => {
    // given
    const m: Promise<ShiftEntity>[] = [];

    for (let i = 0; i < 10; i++) {
      const start = new Date(2024, 1, i + 1);
      const end = new Date(start);
      m[i] = shiftStore.save({
        staff_id: staff.staff_id,
        shift_start: start,
        shift_end: end
      } as ShiftEntity);
    }

    // parallel save
    await Promise.all(m);

    // method to test
    const all = await shiftStore.shiftsInRange(
      staff.staff_id,
      new Date(2023, 1, 1),
      new Date(2023, 1, 30)
    );

    // assert
    expect(all.length).toEqual(0);
  });
});
