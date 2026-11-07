import { TZ } from '@/lib/constants';
import { getStartOfDay } from '@/lib/dateTime';
import { TZDateMini } from '@date-fns/tz';
import {
  addDays,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  getDate,
  isMatch,
  isSameMonth,
  max,
  min,
  parse,
  startOfMonth,
  subMonths,
  type Interval,
} from 'date-fns';

const MONTH_FORMAT = 'yyyy-MM';

/**
 * Resolves the selected month clamped between
 * earliest account month and current month.
 */
export const resolveSpendingMonth = (
  month: string | null,
  earliest: Date | null | undefined
) => {
  const today = getStartOfDay();
  const currentMonth = startOfMonth(today);
  const requestedMonth =
    month && isMatch(month, MONTH_FORMAT)
      ? startOfMonth(parse(month, MONTH_FORMAT, currentMonth))
      : currentMonth;

  // Clamp requested month between earliest account month and current month
  const earliestMonth = earliest
    ? min([startOfMonth(new TZDateMini(earliest, TZ)), currentMonth])
    : currentMonth;
  const selectedMonth = max([
    earliestMonth,
    min([requestedMonth, currentMonth]),
  ]);
  // Prior month to selected month for comparison
  const priorMonth = startOfMonth(subMonths(selectedMonth, 1));
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth);

  let range: Interval<Date, Date>;
  let previousRange: Interval<Date, Date>;

  if (isCurrentMonth) {
    // Month to date vs same time previous month
    range = { start: selectedMonth, end: endOfDay(today) };
    previousRange = {
      start: priorMonth,
      end: endOfDay(
        addDays(
          priorMonth,
          Math.min(getDate(today) - 1, getDate(endOfMonth(priorMonth)) - 1)
        )
      ),
    };
  } else {
    range = { start: selectedMonth, end: endOfMonth(selectedMonth) };
    previousRange = { start: priorMonth, end: endOfMonth(priorMonth) };
  }

  const months = eachMonthOfInterval({
    start: earliestMonth,
    end: currentMonth,
  }).map((month) => format(month, MONTH_FORMAT));

  return {
    currentMonth: format(currentMonth, MONTH_FORMAT),
    selectedMonth: format(selectedMonth, MONTH_FORMAT),
    selectedMonthLabel: format(selectedMonth, 'MMMM yyyy'),
    range,
    previousRange,
    months,
  };
};
