import { TZDateMini } from '@date-fns/tz';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  startOfMonth,
} from 'date-fns';
import { TZ } from './constants';

export type SpendingDay = {
  date: string;
  value: number | null;
};

export type SpendingCalendarMonth = {
  month: string;
  total: number;
  days: SpendingDay[];
};

export const isMonthKey = (value: string) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export const monthKeyToDate = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return TZDateMini.tz(TZ, year, monthIndex - 1, 1);
};

export const getMonthKey = (date: Date) => format(date, 'yyyy-MM');

export const shiftMonthKey = (month: string, amount: number) =>
  getMonthKey(addMonths(monthKeyToDate(month), amount));

export const getMonthKeys = (startMonth: string, count: number) =>
  Array.from({ length: count }, (_, index) =>
    shiftMonthKey(startMonth, index)
  );

export const groupCalendarMonths = (
  startMonth: string,
  count: number,
  spendingDays: SpendingDay[]
): SpendingCalendarMonth[] => {
  const values = new Map(spendingDays.map((day) => [day.date, day.value]));

  return getMonthKeys(startMonth, count).map((month) => {
    const start = startOfMonth(monthKeyToDate(month));
    const days = eachDayOfInterval({ start, end: endOfMonth(start) }).map(
      (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return {
          date: dateKey,
          value: values.get(dateKey) ?? null,
        };
      }
    );

    return {
      month,
      total: days.reduce((total, day) => total + (day.value ?? 0), 0),
      days,
    };
  });
};

export const getCalendarPadding = (month: string) => {
  const start = monthKeyToDate(month);
  const leadingDays = getISODay(start) - 1;
  const trailingDays =
    (7 - ((leadingDays + endOfMonth(start).getDate()) % 7)) % 7;

  return {
    leading: Array.from({ length: leadingDays }, (_, index) =>
      format(addDays(start, index - leadingDays), 'yyyy-MM-dd')
    ),
    trailing: Array.from({ length: trailingDays }, (_, index) =>
      format(addDays(endOfMonth(start), index + 1), 'yyyy-MM-dd')
    ),
  };
};

export const getSpendingIntensity = (
  value: number | null,
  scaleMax: number
) => {
  if (!value || value <= 0 || scaleMax <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / scaleMax) * 4)));
};

export const getPercentile = (values: number[], percentile: number) => {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * percentile) - 1)
  );
  return sorted[index];
};
