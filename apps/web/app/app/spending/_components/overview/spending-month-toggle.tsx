'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui';
import { format, parse } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const SpendingMonthToggle = ({
  children,
  months,
  selected,
  currentMonth,
}: {
  children: ReactNode;
  /** Every selectable month (yyyy-MM), oldest first */
  months: string[];
  /** Selected month (yyyy-MM) */
  selected: string;
  /** Current month (yyyy-MM) */
  currentMonth: string;
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: Math.max(months.indexOf(selected), 0),
    align: 'center',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Disable back/forward buttons when at start/end of carousel
  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateButtons();
    emblaApi.on('select', updateButtons).on('reInit', updateButtons);

    return () => {
      emblaApi.off('select', updateButtons).off('reInit', updateButtons);
    };
  }, [emblaApi]);

  // Update query state once carousel settles on a month
  useEffect(() => {
    if (!emblaApi) return;

    const onSettle = () => {
      const next = months[emblaApi.selectedScrollSnap()];
      if (!next || next === month) return;

      setMonth(next);
    };

    emblaApi.on('settle', onSettle);

    return () => {
      emblaApi.off('settle', onSettle);
    };
  }, [emblaApi, months, month, setMonth]);

  // Set carousel slide from external URL changes
  useEffect(() => {
    if (!emblaApi) return;

    const index = months.indexOf(month);
    // Scroll to the month if it's not the currently selected month
    if (index !== -1 && index !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, months, month]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous month"
          className="rounded-full"
          disabled={!canScrollPrev}
          onClick={scrollPrev}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div
          className="flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
          ref={emblaRef}
        >
          <div className="flex touch-pan-y" aria-live="polite">
            {months.map((slide) => (
              <div
                key={slide}
                className="min-w-0 shrink-0 grow-0 basis-full text-center font-medium select-none"
                aria-hidden={slide !== month}
              >
                {formatMonthLabel(slide)}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next month"
          className="rounded-full"
          disabled={!canScrollNext}
          onClick={scrollNext}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <div
        className={cn('transition-opacity ease-out', isPending && 'opacity-60')}
      >
        {children}
      </div>
    </>
  );
};

export default SpendingMonthToggle;
