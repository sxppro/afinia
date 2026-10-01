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
    shiftMonthKey(meta.currentMonth, -2) < meta.earliestMonth
      ? meta.earliestMonth
      : shiftMonthKey(meta.currentMonth, -2);
  const initialCount = Math.min(
    3,
    monthDistance(initialStart, meta.currentMonth) + 1
  );
  const initialQuery = useQuery(
    trpc.spending.calendarMonths.queryOptions({
      startMonth: initialStart,
      count: initialCount,
    })
  );
  const [months, setMonths] = useState<SpendingCalendarMonthData[]>([]);
  const [isFetchingPrevious, setIsFetchingPrevious] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const prependAnchor = useRef<{ id: string; top: number } | null>(null);
  const inFlightLoadRef = useRef(false);
  const previousWasInView = useRef(false);
  const didInitialScroll = useRef(false);
  const { ref: previousRef, inView: previousInView } = useInView({
    rootMargin: '320px',
  });

  useEffect(() => {
    if (initialQuery.data && months.length === 0) {
      setMonths(initialQuery.data.months);
    }
  }, [initialQuery.data, months.length]);

  useLayoutEffect(() => {
    const anchor = prependAnchor.current;
    if (!anchor) return;
    const anchorElement = document.getElementById(anchor.id);
    if (anchorElement) {
      window.scrollBy({
        top: anchorElement.getBoundingClientRect().top - anchor.top,
      });
    }
    prependAnchor.current = null;
  }, [months]);

  useEffect(() => {
    if (months.length === 0 || didInitialScroll.current) return;
    document
      .getElementById(`spending-month-${meta.currentMonth}`)
      ?.scrollIntoView({ block: 'start' });
    didInitialScroll.current = true;
  }, [meta.currentMonth, months.length]);

  const firstMonth = months[0]?.month;
  const hasPrevious = !!firstMonth && firstMonth > meta.earliestMonth;

  const loadPreviousMonths = useCallback(async () => {
    if (inFlightLoadRef.current || !firstMonth || !hasPrevious) return;

    inFlightLoadRef.current = true;
    const startMonth = [
      shiftMonthKey(firstMonth, -3),
      meta.earliestMonth,
    ].sort().at(-1)!;
    const count = monthDistance(startMonth, firstMonth);
    const anchorId = `spending-month-${firstMonth}`;
    const anchorElement = document.getElementById(anchorId);
    if (anchorElement) {
      prependAnchor.current = {
        id: anchorId,
        top: anchorElement.getBoundingClientRect().top,
      };
    }
    setIsFetchingPrevious(true);
    setLoadError(false);

    try {
      const data = await queryClient.fetchQuery(
        trpc.spending.calendarMonths.queryOptions({ startMonth, count })
      );
      setMonths((current) => [...data.months, ...current]);
    } catch (error) {
      console.error('Failed to load older spending calendar months', error);
      prependAnchor.current = null;
      setLoadError(true);
    } finally {
      inFlightLoadRef.current = false;
      setIsFetchingPrevious(false);
    }
  }, [
    firstMonth,
    hasPrevious,
    meta.earliestMonth,
    queryClient,
    trpc.spending.calendarMonths,
  ]);

  useEffect(() => {
    if (previousInView && !previousWasInView.current) {
      loadPreviousMonths();
    }
    previousWasInView.current = previousInView;
  }, [loadPreviousMonths, previousInView]);

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
    <div className="space-y-5 [overflow-anchor:none]">
      <div className="bg-background/95 sticky top-[4.25rem] z-10 flex items-center justify-between gap-3 py-2 backdrop-blur">
        <p className="text-muted-foreground text-xs">Less spent</p>
        <div className="flex items-center gap-1">{intensityLegend}</div>
        <p className="text-muted-foreground text-xs">More spent</p>
      </div>

      {hasPrevious ? (
        <div ref={previousRef} className="flex h-8 justify-center">
          {isFetchingPrevious ? (
            <Skeleton className="h-2 w-24 rounded-full" />
          ) : loadError ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPreviousMonths}
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
