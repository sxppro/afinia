import { TZDateMini } from '@date-fns/tz';
import {
  endOfDay,
  format,
  Interval,
  max,
  parseISO,
  startOfDay,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns';
import { z } from 'zod';
import { TZ } from './constants';

export const getStartOfDay = () => startOfDay(TZDateMini.tz(TZ));

export const getEndOfDay = () => endOfDay(TZDateMini.tz(TZ));

export const now = () => TZDateMini.tz(TZ);

/**
 * Converts an ISO date (YYYY-MM-DD) to year month (YYYY-MM)
 * @throws If `date` isn't a valid ISO date
 */
export const toYearMonth = (date: string) =>
  format(parseISO(z.iso.date().parse(date)), 'yyyy-MM');

export const getDateRange = (
  range: string,
  all: Date
): Interval<Date, Date> => {
  const start = getStartOfDay();
  const end = getEndOfDay();

  switch (range) {
    case '1m':
      return {
        start: max([subMonths(start, 1), all]),
        end,
      };
    case '3m':
      return {
        start: max([subMonths(start, 3), all]),
        end,
      };
    case '6m':
      return {
        start: max([subMonths(start, 6), all]),
        end,
      };
    case '1y':
      return {
        start: max([subYears(start, 1), all]),
        end,
      };
    case '2y':
      return {
        start: max([subYears(start, 2), all]),
        end,
      };
    case '5y':
      return {
        start: max([subYears(start, 5), all]),
        end,
      };
    case 'ytd':
      return {
        start: max([startOfYear(start), all]),
        end,
      };
    case 'all':
      return {
        start: all,
        end,
      };
    // Default to 1 month
    default:
      return {
        start: max([subMonths(start, 1), all]),
        end,
      };
  }
};
