import { BadRequestException } from '@exceptions/bad-request.exception';
import {
  checkForOverLappingSegments,
  ShiftPayload,
  ShiftSegmentPayload
} from '@models/shift/shift.model';

describe('shift model', () => {
  const validShiftSegment = (start: string, duration: number) => ({
    is_visible: true,
    is_reoccurring: false,
    start: start,
    duration: duration
  });

  const payload = new ShiftPayload();

  beforeEach(() => {
    payload.staff_id = '123456789012345678901234567890123456';
    payload.times = [] as ShiftSegmentPayload[];
  });

  it(`should throw ${BadRequestException.name}. date in the past`, () => {
    // add valid shift segments
    payload.times = [
      validShiftSegment('2024-11-16T10:00:00Z', 3600),
      validShiftSegment('2024-11-16T12:00:00Z', 3600)
    ];

    try {
      checkForOverLappingSegments(payload, new Date(), 'America/Toronto');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain('cannot be in the past');
    }
  });

  it(`should throw ${BadRequestException.name} overlap between shifts`, () => {
    const d = new Date().toISOString();
    payload.times = [validShiftSegment(d, 3600), validShiftSegment(d, 3600)];

    try {
      checkForOverLappingSegments(payload, new Date(), 'America/Toronto');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain('overlap with an existing time period');
    }
  });

  it(`should throw ${BadRequestException.name} invalid date is provided`, () => {
    payload.times = [
      {
        is_visible: true,
        is_reoccurring: false,
        start: 'invalid-date',
        duration: 3600
      }
    ];

    try {
      checkForOverLappingSegments(payload, new Date(), 'America/Toronto');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain('invalid date');
    }
  });
});
