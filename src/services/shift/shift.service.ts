import { IShiftService } from './shift.interface.service';
import {
  ShiftEntity,
  IShiftPayload,
  IShiftResponse
} from '@models/shift/shift.model';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import { NotFoundException } from '@exceptions/not-found.exception';
import { BadRequestException } from '@exceptions/bad-request.exception';
import { InsertionException } from '@exceptions/insertion.exception';
import moment from 'moment-timezone';

export class ShiftService implements IShiftService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly cache: ICache<string, IShiftResponse[]>
  ) {}

  async shifts(
    staffUUID: string,
    month: number,
    year: number,
    timezone: string
  ): Promise<IShiftResponse[]> {
    const key = `${staffUUID.trim()}_${month}_${year}_${timezone}`;

    const found = this.cache.get(key);
    if (found) return found;

    const staff = await this.adapters.staffStore.staffByUUID(staffUUID.trim());

    if (!staff)
      throw new NotFoundException(`no staff with id ${staffUUID.trim()}`);

    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);

    const list = await this.adapters.shiftStore.shiftsInRange(
      staff.staff_id,
      first,
      last
    );

    const result = list.map(
      (shift) =>
        ({
          shift_id: shift.shift_id,
          is_visible: shift.is_visible,
          is_reoccurring: shift.is_reoccurring,
          start: moment(shift.shift_start).tz(timezone).valueOf(),
          end: moment(shift.shift_end).tz(timezone).valueOf()
        }) as IShiftResponse
    );

    this.cache.put(key, result);
    return result;
  }

  async create(dto: IShiftPayload): Promise<void> {
    // find staff
    const staff = await this.adapters.staffStore.staffByUUID(dto.staffId);
    if (!staff)
      throw new NotFoundException(`staff with id ${dto.staffId} not found`);

    // validate no conflict in parallel
    const defer = dto.times.map(async (obj) => {
      const num = await this.adapters.shiftStore.countShiftsInRange(
        staff.staff_id,
        obj.start,
        obj.end
      );

      if (num > 0)
        throw new BadRequestException(`conflicting schedule ${obj.start}`);
    });

    await Promise.all(defer);

    try {
      // save
      await this.adapters.txProvider?.runInTransaction(async (adapters) => {
        for (let i = 0; i < dto.times.length; i++) {
          await adapters.shiftStore.save({
            staff_id: staff.staff_id,
            shift_start: dto.times[i].start,
            shift_end: dto.times[i].end,
            is_visible: dto.times[i].isVisible,
            is_reoccurring: dto.times[i].isReoccurring
          } as ShiftEntity);
        }
      });
      this.cache.clear();
    } catch (e) {
      this.logger.error(`${e}`);
      throw new InsertionException('error saving shift');
    }
  }
}
