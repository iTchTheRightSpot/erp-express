import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator';
import { BadRequestException } from '@exceptions/bad-request.exception';
import moment from 'moment-timezone';

export interface ShiftEntity {
  shift_id: string;
  staff_id: string;
  shift_start: Date;
  shift_end: Date;
  is_visible: boolean;
  is_reoccurring: boolean;
}

export interface IShiftResponse {
  shift_id: string;
  is_visible: boolean;
  is_reoccurring: boolean;
  start: number;
  end: number;
}

export interface AllShiftsPayload {
  staffUUID: string;
  month: number;
  year: number;
  timezone: string;
}

export interface ISchedulePeriod {
  isVisible: boolean;
  isReoccurring: boolean;
  start: Date;
  end: Date;
}

export interface IShiftPayload {
  staffId: string;
  times: ISchedulePeriod[];
}

export class ShiftSegmentPayload {
  @IsDefined({ message: 'is_visible has to be defined' })
  is_visible: boolean;

  @IsDefined({ message: 'is_reoccurring has to be defined' })
  is_reoccurring: boolean;

  @IsDefined({ message: 'start has to be defined' })
  @IsString({ message: 'start has to be a string' })
  start: string; // in ISO 8601 standard

  @IsDefined({ message: 'duration in seconds has to be defined' })
  duration: number; // in seconds
}

export class ShiftPayload {
  @IsDefined({ message: 'staff_id has to be defined' })
  @IsNotEmpty({ message: 'staff_id cannot be empty' })
  @IsString({ message: 'staff_id has to be a string' })
  @MinLength(36, { message: 'staff_id must be at min 36 characters' })
  @MaxLength(37, { message: 'staff_id must be at most 37 characters' })
  staff_id: string;

  @IsDefined({ message: 'times has to be defined' })
  @IsNotEmpty({ message: 'times cannot be empty' })
  times: ShiftSegmentPayload[];

  constructor(dto?: ShiftPayload) {
    if (!dto) return;
    this.staff_id = dto.staff_id;
    this.times = dto.times;
  }

  checkForOverLappingSegments = (now: Date, timezone: string) => {
    const result: IShiftPayload = {
      staffId: this.staff_id.trim(),
      times: [] as ISchedulePeriod[]
    };

    for (let i = 0; i < this.times.length; i++) {
      let parse: moment.Moment;

      const m = moment(this.times[i].start, moment.ISO_8601, true);

      if (!m.isValid())
        throw new BadRequestException(
          `${this.times[i].start} has to be in ISO format (ISO 8601)`
        );

      parse = m.tz(timezone);
      if (!parse.isValid())
        throw new BadRequestException(
          `invalid date ${JSON.stringify(this.times[i].start)}`
        );

      if (parse.toDate() < now)
        throw new BadRequestException(
          `${JSON.stringify(this.times[i].start)} cannot be in the past`
        );

      const start = parse.toDate();
      const end = new Date(start);
      end.setSeconds(end.getSeconds() + this.times[i].duration);

      if (result.times.some((obj) => start <= obj.end && end >= obj.start))
        throw new BadRequestException(
          `${JSON.stringify(this.times[i].start)} and duration ${JSON.stringify(this.times[i].duration)} overlap with an existing time period`
        );

      result.times[i] = {
        isVisible: this.times[i].is_visible,
        isReoccurring: this.times[i].is_reoccurring,
        start: start,
        end: end
      };
    }

    return result;
  };
}
