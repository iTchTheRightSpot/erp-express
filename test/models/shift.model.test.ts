import { BadRequestException } from '@exceptions/bad-request.exception';
import { ShiftPayload } from '@models/shift/shift.model';

describe('shift model', () => {
  const validShiftSegment = (start: string, duration: number) => ({
    is_visible: true,
    is_reoccurring: false,
    start: start,
    duration: duration
  });

  const payload = new ShiftPayload();
  payload.staff_id = '123456789012345678901234567890123456';

  it(`should throw ${BadRequestException.name}. date in the past`, () => {
    // add valid shift segments
    payload.times = [validShiftSegment('2024-11-16T12:00:00Z', 3600)];

    try {
      payload.checkForOverLappingSegments(new Date(), 'America/Toronto');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain('cannot be in the past');
    }
  });

  it(`should throw ${BadRequestException.name} overlap between shifts`, () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);

    const str = date.toISOString();
    payload.times = [
      validShiftSegment(str, 3600),
      validShiftSegment(str, 3600)
    ];

    try {
      payload.checkForOverLappingSegments(new Date(), 'America/Toronto');
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
      payload.checkForOverLappingSegments(new Date(), 'America/Toronto');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain('has to be in ISO format (ISO 8601)');
    }
  });

  it(`should throw ${BadRequestException.name} working hrs bleeds into the following day`, () => {
    const d = new Date();
    d.setHours(23);
    const str = d.toISOString();
    payload.times = [validShiftSegment(str, 3600 * 2)];

    try {
      payload.checkForOverLappingSegments(new Date(), 'UTC');
    } catch (e) {
      const err = e as BadRequestException;
      expect(err.message).toContain(
        'plus duration cannot include the next day'
      );
    }
  });
});
