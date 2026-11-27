'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SpendingByCategorySkeleton } from '@/components/vis/category/spending-by-category';
import { cn } from '@/lib/ui';
import { format, parse } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { ReactNode, useCallback, useEffect, useState } from 'react';

const formatMonthLabel = (month: string) =>
  format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy');

interface CategoryMonthContent {
  total: ReactNode;
  chart: ReactNode;
  categories?: ReactNode;
}

interface CategoryMonthCarouselProps {
  /** Every selectable month (yyyy-MM), oldest first */
  months: string[];
  /** Selected month (yyyy-MM) */
  selected: string;
  /** Current month (yyyy-MM) */
  currentMonth: string;
  total: ReactNode;
  chart: ReactNode;
  categories?: ReactNode;
}

const CategoryMonthCarousel = ({
  months,
  selected,
  currentMonth,
  total,
  chart,
  categories,
}: CategoryMonthCarouselProps) => {
  const [month, setMonth] = useQueryState(
    'month',
    parseAsString
      .withOptions({
        history: 'replace',
        scroll: false,
        shallow: false,
        clearOnDefault: true,
      })
      .withDefault(currentMonth)
  );
  // Only calculated once on mount
  const [startIndex] = useState(() => Math.max(months.indexOf(selected), 0));
  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  // Track whether server re=rendered or not based on props
  const [synced, setSynced] = useState({ selected, chart });
  /**
   * 'Cache' of server-rendered content for visited months,
   * saved so revisiting one shows it immediately while server re-renders
   */
  const [rendered, setRendered] = useState<
    Record<string, CategoryMonthContent>
  >(() => ({ [selected]: { total, chart, categories } }));

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex,
    align: 'center',
  });

  const activeMonth = months.includes(month) ? month : selected;
  const displayedMonth = months[selectedIndex] ?? selected;

  // If there's a new month or re-render, cache the new month
  if (synced.selected !== selected || synced.chart !== chart) {
    setSynced({ selected, chart });
    setRendered((prev) => ({
      ...prev,
      [selected]: { total, chart, categories },
    }));
  }

  // Track the slide and disable back/forward buttons at either end
  useEffect(() => {
    if (!emblaApi) return;

    const update = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    update();
    emblaApi.on('select', update).on('reInit', update);

    return () => {
      emblaApi.off('select', update).off('reInit', update);
    };
  }, [emblaApi]);

  // Update the URL as soon as the carousel picks a month
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const next = months[emblaApi.selectedScrollSnap()];
      if (!next || next === activeMonth) return;

      setMonth(next);
    };

    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, months, activeMonth, setMonth]);

  // Set carousel slide from external URL changes
  useEffect(() => {
    if (!emblaApi) return;

    const index = months.indexOf(activeMonth);
    if (index !== -1 && index !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, months, activeMonth]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <p className="font-medium" aria-live="polite">
            {formatMonthLabel(displayedMonth)}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full has-[>svg]:px-1"
              aria-label="Previous month"
              disabled={!canScrollPrev}
              onClick={scrollPrev}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full has-[>svg]:px-1"
              aria-label="Next month"
              disabled={!canScrollNext}
              onClick={scrollNext}
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex h-10 items-end gap-1 pb-1">
          {rendered[displayedMonth]?.total ?? (
            <Skeleton className="h-full w-24" />
          )}
        </div>
        <div
          className="relative cursor-grab overflow-hidden active:cursor-grabbing"
          ref={emblaRef}
        >
          {/* Hidden until embla hydrates */}
          <div className={cn('flex touch-pan-y', !emblaApi && 'invisible')}>
            {months.map((slide) => (
              <div
                key={slide}
                className="min-w-0 shrink-0 grow-0 basis-full"
                aria-hidden={slide !== activeMonth}
              >
                {rendered[slide]?.chart ?? <Skeleton className="h-48 w-full" />}
              </div>
            ))}
          </div>
          {!emblaApi ? (
            <Skeleton className="absolute inset-0 h-48 w-full" />
          ) : null}
        </div>
      </div>
      {categories ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Categories</h2>
          {rendered[displayedMonth]?.categories ?? (
            <SpendingByCategorySkeleton />
          )}
        </div>
      ) : null}
    </>
  );
};

export default CategoryMonthCarousel;
