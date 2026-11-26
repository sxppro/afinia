'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/ui';
import { format, parse } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from 'react';

const formatMonthLabel = (month: string) =>
  format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy');

const CategoryMonthCarousel = ({
  months,
  selected,
  currentMonth,
  total,
  chart,
  categories,
}: {
  /** Every selectable month (yyyy-MM), oldest first */
  months: string[];
  /** Selected month (yyyy-MM) */
  selected: string;
  /** Current month (yyyy-MM) */
  currentMonth: string;
  total: ReactNode;
  chart: ReactNode;
  categories?: ReactNode;
}) => {
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useQueryState(
    'month',
    parseAsString
      .withOptions({
        history: 'replace',
        scroll: false,
        shallow: false,
        startTransition,
        clearOnDefault: true,
      })
      .withDefault(currentMonth)
  );
  // Only calculated once on mount
  const [startIndex] = useState(() => Math.max(months.indexOf(selected), 0));
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex,
    align: 'center',
  });
  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const activeMonth = months.includes(month) ? month : selected;

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

  const pendingClassName = cn(
    'transition-opacity ease-out',
    isPending && 'opacity-60'
  );

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <p className="font-medium" aria-live="polite">
            {formatMonthLabel(months[selectedIndex] ?? selected)}
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
        <div className={cn('flex h-10 items-end gap-1 pb-1', pendingClassName)}>
          {total}
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
                {slide === selected ? (
                  chart
                ) : (
                  <Skeleton className="h-48 w-full" />
                )}
              </div>
            ))}
          </div>
          {!emblaApi ? (
            <Skeleton className="absolute inset-0 h-48 w-full" />
          ) : null}
        </div>
      </div>
      {categories ? (
        <div className={cn('flex flex-col gap-2', pendingClassName)}>
          <h2 className="text-xl font-semibold">Categories</h2>
          {categories}
        </div>
      ) : null}
    </>
  );
};

export default CategoryMonthCarousel;
