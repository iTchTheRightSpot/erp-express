import { IShiftService } from './shift.interface.service';
import { IShift, IShiftPayload } from '@models/shift/shift.model';
import { ILogger } from '@utils/log';
import { Adapters } from '@stores/adapters';
import { ICache } from '@utils/cache';
import { NotFoundException } from '@exceptions/not-found.exception';
import { BadRequestException } from '@exceptions/bad-request.exception';
import { InsertionException } from '@exceptions/insertion.exception';

export class ShiftService implements IShiftService {
  constructor(
    private readonly logger: ILogger,
    private readonly adapters: Adapters,
    private readonly cache: ICache<string, {}>
  ) {}

  async create(dto: IShiftPayload): Promise<void> {
    // find staff
    const staff = await this.adapters.staffStore.staffByUUID(dto.staffId);
    if (!staff)
      throw new NotFoundException(`staff with id ${dto.staffId} not found`);

    // validate no conflict in parallel
    const defer = dto.times.map(async (obj) => {
      const num = await this.adapters.shiftStore.countExistingShiftsForStaff(
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
      const savePromises = dto.times.map((time) =>
        this.adapters.txProvider!.runInTransaction(async (adapters) => {
          await adapters.shiftStore.save({
            staff_id: staff.staff_id,
            shift_start: time.start,
            shift_end: time.end,
            is_visible: time.isVisible,
            is_reoccurring: time.isReoccurring
          } as IShift);
        })
      );

      await Promise.all(savePromises);
      this.cache.clear();
    } catch (e) {
      this.logger.error(`${JSON.stringify(e)}`);
      throw new InsertionException('error saving shift');
    }
  }
}
