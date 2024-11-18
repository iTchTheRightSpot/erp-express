import { IShiftStore } from './shift.interface.store';
import { IShift } from '@models/shift/shift.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class ShiftStore implements IShiftStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: IShift): Promise<IShift> {
    const q = `
      INSERT INTO shift (shift_start, shift_end, is_visible, is_reoccurring, staff_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING shift_id, shift_start, shift_end, is_visible, is_reoccurring, staff_id
    `;

    return new Promise<IShift>(async (resolve, reject) => {
      try {
        const res = await this.db.execContext(
          q,
          s.shift_start,
          s.shift_end,
          s.is_visible === undefined ? false : s.is_visible,
          s.is_reoccurring === undefined ? false : s.is_reoccurring,
          s.staff_id
        );

        const row = res.rows[0] as IShift;
        row.shift_id = Number(row.shift_id);
        row.staff_id = Number(row.staff_id);

        resolve(row);
        this.logger.log('new shift save');
      } catch (e) {
        this.logger.error(`exception saving shift ${JSON.stringify(e)}`);
        reject(e);
      }
    });
  }

  countExistingShiftsForStaff(
    staffId: number,
    start: Date,
    end: Date
  ): Promise<number> {
    const q = `
        SELECT COUNT(s.shift_id) FROM shift s
        WHERE s.staff_id = $1
        AND (
          (s.shift_start BETWEEN $2 AND $3) OR
          (s.shift_end BETWEEN $2 AND $3)
        )
      `;

    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.execContext(q, staffId, start, end);
        const row = res.rows[0];
        if (!row) {
          reject(-1);
          return;
        }
        resolve(Number(row.count));
      } catch (e) {
        this.logger.error(e);
        reject(e);
      }
    });
  }
}
