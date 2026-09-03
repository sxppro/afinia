import { cn, formatCurrency } from '@/lib/ui';
import {
  getCalendarPadding,
  getSpendingIntensity,
  monthKeyToDate,
  SpendingCalendarMonth as SpendingCalendarMonthData,
} from '@/lib/spending-insights';
import { format } from 'date-fns';
import Link from 'next/link';

const intensityClasses = [
  'bg-muted/60 hover:bg-muted',
  'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900',
  'bg-blue-200 hover:bg-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800',
  'bg-blue-400 text-white hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600',
  'bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400',
];

const SpendingCalendarMonth = ({
  month,
  today,
  scaleMax,
}: {
  month: SpendingCalendarMonthData;
  today: string;
  scaleMax: number;
}) => {
  const padding = getCalendarPadding(month.month);

  return (
    <section
      id={`spending-month-${month.month}`}
      className="[content-visibility:auto] [contain-intrinsic-size:auto_390px]"
    >
      <div className="bg-background/95 sticky top-0 z-10 flex items-baseline justify-between py-3 backdrop-blur">
        <h2 className="text-xl font-semibold">
          {format(monthKeyToDate(month.month), 'MMMM yyyy')}
        </h2>
        <p className="text-muted-foreground text-sm font-medium">
          {formatCurrency(month.total, { baseUnits: true })}
        </p>
      </div>
      <div
        className="mb-1 grid grid-cols-7 gap-1 text-center"
        aria-hidden="true"
      >
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`} className="text-muted-foreground text-xs">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {padding.leading.map((date) => (
          <div key={date} className="aspect-square" aria-hidden="true" />
        ))}
        {month.days.map((day) => {
          const intensity = getSpendingIntensity(day.value, scaleMax);
          const isToday = day.date === today;
          const label =
            day.value === null
              ? `${format(monthKeyToDate(day.date.slice(0, 7)), 'MMMM')} ${Number(day.date.slice(-2))}, future date`
              : `${day.date}, ${formatCurrency(day.value, {
                  baseUnits: true,
                  decimals: 2,
                })} spent`;

          return day.value === null ? (
            <div
              key={day.date}
              aria-label={label}
              className="text-muted-foreground/50 flex aspect-square items-center justify-center rounded-lg text-sm"
            >
              {Number(day.date.slice(-2))}
            </div>
          ) : (
            <Link
              key={day.date}
              href={`/app/transactions?from=${day.date}&to=${day.date}`}
              aria-label={label}
              title={label}
              className={cn(
                'focus-visible:ring-ring flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                intensityClasses[intensity],
                isToday && 'ring-2 ring-blue-600 ring-offset-2'
              )}
            >
              {Number(day.date.slice(-2))}
            </Link>
          );
        })}
        {padding.trailing.map((date) => (
          <div key={date} className="aspect-square" aria-hidden="true" />
        ))}
      </div>
    </section>
  );
};

export default SpendingCalendarMonth;
