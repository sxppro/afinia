import { getStartOfDay } from '@/lib/dateTime';
import { TZ } from '@/lib/constants';
import {
  getEarliestSpendingDate,
  getSpendingByDay,
} from '@/lib/db/spending';
import {
  getMonthKey,
  getPercentile,
  groupCalendarMonths,
  isMonthKey,
  monthKeyToDate,
} from '@/lib/spending-insights';
import { TZDateMini } from '@date-fns/tz';
import {
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { z } from 'zod';
import { authProcedure, router } from '../init';

const monthKey = z.string().refine(isMonthKey, 'Expected a yyyy-MM month');

export const spendingRouter = router({
  calendarMeta: authProcedure.query(async () => {
    const today = getStartOfDay();
    const earliestDate = await getEarliestSpendingDate();
    const scaleStart = startOfMonth(subMonths(today, 11));
    const scaleDays = await getSpendingByDay({
      range: { start: scaleStart, end: endOfMonth(today) },
    });

    return {
      today: format(today, 'yyyy-MM-dd'),
      currentMonth: getMonthKey(today),
      earliestMonth: earliestDate
        ? getMonthKey(startOfMonth(new TZDateMini(earliestDate, TZ)))
        : getMonthKey(today),
      latestMonth: getMonthKey(endOfYear(today)),
      scaleMax: getPercentile(
        scaleDays.flatMap(({ value }) => (value ? [value] : [])),
        0.9
      ),
    };
  }),

  calendarMonths: authProcedure
    .input(
      z.object({
        startMonth: monthKey,
        count: z.number().int().min(1).max(3).default(3),
      })
    )
    .query(async ({ input }) => {
      const start = monthKeyToDate(input.startMonth);
      const end = endOfMonth(addMonths(start, input.count - 1));
      const days = await getSpendingByDay({ range: { start, end } });

      return {
        months: groupCalendarMonths(input.startMonth, input.count, days),
      };
    }),
});

export type SpendingRouter = typeof spendingRouter;
