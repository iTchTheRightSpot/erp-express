import { Pool, PoolClient } from 'pg';
import { IProfile } from '../../../src/models/profile/profile.model';
import { IStaffStore } from '../../../src/stores/staff/staff.interface.store';
import { poolInstance } from '../../mock/pool';
import { DevelopmentLogger } from '../../../src/utils/log';
import { MockLiveDatabaseClient } from '../../mock/db-client';
import { ProfileStore } from '../../../src/stores/profile/profile.store';
import { StaffStore } from '../../../src/stores/staff/staff.store';
import { IShiftStore } from '../../../src/stores/shift/shift.interface.store';
import { IStaff } from '../../../src/models/staff/staff.model';
import { ShiftStore } from '../../../src/stores/shift/shift.store';
import { IShift } from '../../../src/models/shift/shift.model';

describe('shift store', () => {
  const logger = new DevelopmentLogger();
  let pool: Pool;
  let client: PoolClient;
  let staff: IStaff;
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
    staff = await staffStore.save({} as IStaff);
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
    } as IShift;

    // method to test
    const save = await shiftStore.save(shift);

    // assert
    expect(save.shift_id).toBeGreaterThan(0);
  });
});
