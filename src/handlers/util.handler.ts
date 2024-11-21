import { BadRequestException } from '@exceptions/bad-request.exception';
import moment from 'moment-timezone';

export const isInvalidateMonthYear = (month: any, year: any) => {
  if (!month || !year)
    throw new BadRequestException(
      '"month" and "year" query parameters are required'
    );

  const monthNumber = parseInt(month as string, 10);
  const yearNumber = parseInt(year as string, 10);

  if (isNaN(monthNumber) || isNaN(yearNumber))
    throw new BadRequestException('"month" and "year" must be valid numbers');

  if (!moment(monthNumber, 'M', true).isValid())
    throw new BadRequestException('"month" must be a valid month (1-12)');

  return { month: monthNumber, year: yearNumber };
};

export const resolveTimezone = (timezone: any, defaultTimezone: string) => {
  const timezoneFromRequest = timezone as string | undefined;
  return timezoneFromRequest?.length && moment.tz.zone(timezoneFromRequest)
    ? timezoneFromRequest
    : defaultTimezone;
};
