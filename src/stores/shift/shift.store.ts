import { IShiftStore } from './shift.interface.store';
import { ShiftEntity } from '@models/shift/shift.model';
import { ILogger } from '@utils/log';
import { IDatabaseClient } from '@stores/db-client';

export class ShiftStore implements IShiftStore {
  constructor(
    private readonly logger: ILogger,
    private readonly db: IDatabaseClient
  ) {}

  save(s: ShiftEntity): Promise<ShiftEntity> {
    const q = `
      INSERT INTO shift (shift_start, shift_end, is_visible, is_reoccurring, staff_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING shift_id, shift_start, shift_end, is_visible, is_reoccurring, staff_id
    `;

    return new Promise<ShiftEntity>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(
          q,
          s.shift_start,
          s.shift_end,
          s.is_visible === undefined ? false : s.is_visible,
          s.is_reoccurring === undefined ? false : s.is_reoccurring,
          s.staff_id
        );
        resolve(res.rows[0] as ShiftEntity);
        this.logger.log('new shift save');
      } catch (e) {
        this.logger.error(`exception saving shift ${JSON.stringify(e)}`);
        reject(e);
      }
    });
  }

  countShiftsInRange(staffId: string, start: Date, end: Date): Promise<number> {
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
        const res = await this.db.exec(q, staffId, start, end);
        const row = res.rows[0];
        if (!row) {
          resolve(0);
          return;
        }
        resolve(Number(row.count));
      } catch (e) {
        this.logger.error(e);
        reject(e);
      }
    });
  }

  shiftsInRange(
    staffId: string,
    start: Date,
    end: Date
  ): Promise<ShiftEntity[]> {
    const q = `
      SELECT * FROM shift s
      WHERE s.staff_id = $1
      AND (
          (s.shift_start BETWEEN $2 AND $3) OR
          (s.shift_end BETWEEN $2 AND $3)
      )
    `;

    return new Promise<ShiftEntity[]>(async (resolve, reject) => {
      try {
        const result = await this.db.exec(q, staffId, start, end);

        if (!result.rows) {
          resolve([] as ShiftEntity[]);
          return;
        }

        resolve(result.rows as ShiftEntity[]);
      } catch (e) {
        this.logger.error(`exception retrieving shifts in range ${e}`);
        reject(e);
      }
    });
  }

  shiftsInRangeAndVisibilityAndDifference(
    staffId: string,
    start: Date,
    end: Date,
    isVisible: boolean,
    seconds: number
  ): Promise<ShiftEntity[]> {
    const q = `
        SELECT * FROM shift s
        WHERE s.staff_id = $1
        AND (
            (s.shift_start BETWEEN $2 AND $3) OR
            (s.shift_end BETWEEN $2 AND $3)
        )
        AND is_visible = $4
        AND EXTRACT(EPOCH FROM (s.shift_end - s.shift_start)) >= $5
    `;

    return new Promise<ShiftEntity[]>(async (resolve, reject) => {
      try {
        const result = await this.db.exec(
          q,
          staffId,
          start,
          end,
          isVisible,
          seconds
        );
        if (!result.rows) {
          resolve([] as ShiftEntity[]);
          return;
        }
        resolve(result.rows as ShiftEntity[]);
      } catch (e) {
        this.logger.error(`exception retrieving shifts in range ${e}`);
        reject(e);
      }
    });
  }

  countShiftsInRangeAndVisibility(
    staffId: string,
    start: Date,
    end: Date,
    isVisible: boolean
  ): Promise<number> {
    const q = `
      SELECT COUNT(*) FROM shift s
      WHERE s.staff_id = $1
      AND (
          ($2 BETWEEN s.shift_start AND s.shift_end) AND
          ($3 BETWEEN s.shift_start AND s.shift_end)
      )
      AND is_visible = $4
    `;

    return new Promise<number>(async (resolve, reject) => {
      try {
        const res = await this.db.exec(q, staffId, start, end, isVisible);
        const row = res.rows[0];
        if (!row) {
          resolve(0);
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
