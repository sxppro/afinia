import { TZDateMini } from '@date-fns/tz';
import {
  endOfDay,
  Interval,
  max,
  startOfDay,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns';
import { TZ } from './constants';

export const getStartOfDay = () => startOfDay(TZDateMini.tz(TZ));

export const getEndOfDay = () => endOfDay(TZDateMini.tz(TZ));

export const now = () => TZDateMini.tz(TZ);

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
