'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  shiftMonthKey,
  SpendingCalendarMonth as SpendingCalendarMonthData,
} from '@/lib/spending-insights';
import { useTRPC } from '@/trpc/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarMonths } from 'date-fns';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';
import SpendingCalendarMonth from './spending-calendar-month';

type CalendarMeta = {
  today: string;
  currentMonth: string;
  earliestMonth: string;
  latestMonth: string;
  scaleMax: number;
};

const monthDistance = (from: string, to: string) =>
  differenceInCalendarMonths(
    new Date(`${to}-01T12:00:00`),
    new Date(`${from}-01T12:00:00`)
  );

const CalendarSkeleton = () => (
  <div className="space-y-6">
    {[0, 1].map((month) => (
      <div key={month} className="space-y-3">
        <Skeleton className="h-7 w-36" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, day) => (
            <Skeleton key={day} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const LoadedCalendar = ({ meta }: { meta: CalendarMeta }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const initialStart =
    shiftMonthKey(meta.currentMonth, -1) < meta.earliestMonth
      ? meta.earliestMonth
      : shiftMonthKey(meta.currentMonth, -1);
  const initialCount = Math.min(
    3,
    monthDistance(initialStart, meta.latestMonth) + 1
  );
  const initialQuery = useQuery(
    trpc.spending.calendarMonths.queryOptions({
      startMonth: initialStart,
      count: initialCount,
    })
  );
  const [months, setMonths] = useState<SpendingCalendarMonthData[]>([]);
  const [loadingDirection, setLoadingDirection] = useState<
    'previous' | 'next' | null
  >(null);
  const [loadError, setLoadError] = useState<'previous' | 'next' | null>(null);
  const prependHeight = useRef<number | null>(null);
  const didInitialScroll = useRef(false);
  const { ref: previousRef, inView: previousInView } = useInView({
    rootMargin: '320px',
  });
  const { ref: nextRef, inView: nextInView } = useInView({
    rootMargin: '320px',
  });

  useEffect(() => {
    if (initialQuery.data && months.length === 0) {
      setMonths(initialQuery.data.months);
    }
  }, [initialQuery.data, months.length]);

  useLayoutEffect(() => {
    if (prependHeight.current === null) return;
    const addedHeight =
      document.documentElement.scrollHeight - prependHeight.current;
    window.scrollBy({ top: addedHeight });
    prependHeight.current = null;
  }, [months]);

  useEffect(() => {
    if (months.length === 0 || didInitialScroll.current) return;
    document
      .getElementById(`spending-month-${meta.currentMonth}`)
      ?.scrollIntoView({ block: 'start' });
    didInitialScroll.current = true;
  }, [meta.currentMonth, months.length]);

  const firstMonth = months[0]?.month;
  const lastMonth = months.at(-1)?.month;
  const hasPrevious = !!firstMonth && firstMonth > meta.earliestMonth;
  const hasNext = !!lastMonth && lastMonth < meta.latestMonth;

  const loadMonths = useCallback(
    async (direction: 'previous' | 'next') => {
      if (loadingDirection || !firstMonth || !lastMonth) return;
      if (
        (direction === 'previous' && !hasPrevious) ||
        (direction === 'next' && !hasNext)
      )
        return;

      const startMonth =
        direction === 'previous'
          ? [
              shiftMonthKey(firstMonth, -3),
              meta.earliestMonth,
            ].sort().at(-1)!
          : shiftMonthKey(lastMonth, 1);
      const count =
        direction === 'previous'
          ? monthDistance(startMonth, firstMonth)
          : Math.min(3, monthDistance(startMonth, meta.latestMonth) + 1);

      setLoadingDirection(direction);
      setLoadError(null);
      if (direction === 'previous') {
        prependHeight.current = document.documentElement.scrollHeight;
      }

      try {
        const data = await queryClient.fetchQuery(
          trpc.spending.calendarMonths.queryOptions({ startMonth, count })
        );
        setMonths((current) =>
          direction === 'previous'
            ? [...data.months, ...current]
            : [...current, ...data.months]
        );
      } catch (error) {
        console.error('Failed to load spending calendar months', error);
        prependHeight.current = null;
        setLoadError(direction);
      } finally {
        setLoadingDirection(null);
      }
    },
    [
      firstMonth,
      hasNext,
      hasPrevious,
      lastMonth,
      loadingDirection,
      meta.earliestMonth,
      meta.latestMonth,
      queryClient,
      trpc.spending.calendarMonths,
    ]
  );

  useEffect(() => {
    if (previousInView) loadMonths('previous');
  }, [loadMonths, previousInView]);

  useEffect(() => {
    if (nextInView) loadMonths('next');
  }, [loadMonths, nextInView]);

  const intensityLegend = useMemo(
    () =>
      [
        'bg-muted',
        'bg-blue-100 dark:bg-blue-950',
        'bg-blue-200 dark:bg-blue-900',
        'bg-blue-400 dark:bg-blue-700',
        'bg-blue-700 dark:bg-blue-500',
      ].map((className, index) => (
        <span
          key={index}
          className={`size-4 rounded ${className}`}
          aria-hidden="true"
        />
      )),
    []
  );

  if (initialQuery.isPending) return <CalendarSkeleton />;
  if (initialQuery.isError) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Failed to load the spending calendar
        </p>
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          onClick={() => initialQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">Less spent</p>
        <div className="flex items-center gap-1">{intensityLegend}</div>
        <p className="text-muted-foreground text-xs">More spent</p>
      </div>

      {hasPrevious ? (
        <div ref={previousRef} className="flex h-8 justify-center">
          {loadingDirection === 'previous' ? (
            <Skeleton className="h-2 w-24 rounded-full" />
          ) : loadError === 'previous' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMonths('previous')}
            >
              Retry older months
            </Button>
          ) : null}
        </div>
      ) : null}

      {months.map((month) => (
        <SpendingCalendarMonth
          key={month.month}
          month={month}
          today={meta.today}
          scaleMax={meta.scaleMax}
        />
      ))}

      {hasNext ? (
        <div ref={nextRef} className="flex h-8 justify-center">
          {loadingDirection === 'next' ? (
            <Skeleton className="h-2 w-24 rounded-full" />
          ) : loadError === 'next' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMonths('next')}
            >
              Retry newer months
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const SpendingCalendar = () => {
  const trpc = useTRPC();
  const metaQuery = useQuery(trpc.spending.calendarMeta.queryOptions());

  if (metaQuery.isPending) return <CalendarSkeleton />;
  if (metaQuery.isError) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Failed to prepare the spending calendar
        </p>
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          onClick={() => metaQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return <LoadedCalendar meta={metaQuery.data} />;
};

export default SpendingCalendar;
