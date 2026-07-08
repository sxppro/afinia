'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { now } from '@/lib/dateTime';
import { cn } from '@/lib/ui';
import { differenceInYears } from 'date-fns';
import { useQueryState } from 'nuqs';

const RANGE_OPTIONS = [
  {
    label: '1M',
    value: '1m',
  },
  {
    label: '3M',
    value: '3m',
  },
  {
    label: '6M',
    value: '6m',
  },
  {
    label: 'YTD',
    value: 'ytd',
  },
  {
    label: '1Y',
    value: '1y',
  },
  {
    label: 'ALL',
    value: 'all',
  },
];

const EXTENDED_RANGE_OPTIONS = [
  {
    label: '1M',
    value: '1m',
  },
  {
    label: '6M',
    value: '6m',
  },
  {
    label: 'YTD',
    value: 'ytd',
  },
  {
    label: '1Y',
    value: '1y',
  },
  {
    label: '2Y',
    value: '2y',
  },
  {
    label: 'ALL',
    value: 'all',
  },
];

const LONG_RANGE_OPTIONS = [
  {
    label: '1M',
    value: '1m',
  },
  {
    label: '6M',
    value: '6m',
  },
  {
    label: '1Y',
    value: '1y',
  },
  {
    label: '2Y',
    value: '2y',
  },
  {
    label: '5Y',
    value: '5y',
  },
  {
    label: 'ALL',
    value: 'all',
  },
];

const DateRangePicker = ({ lowerBound }: { lowerBound?: Date }) => {
  const [range, setRange] = useQueryState('range', {
    defaultValue: '1m',
    shallow: false,
  });

  // Compute options based on lower bound, if provided
  const years = lowerBound ? differenceInYears(now(), lowerBound) : null;
  const rangeOptions = years
    ? years > 5
      ? LONG_RANGE_OPTIONS
      : years > 2
        ? EXTENDED_RANGE_OPTIONS
        : RANGE_OPTIONS
    : RANGE_OPTIONS;

  return (
    <ButtonGroup>
      {rangeOptions.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant="outline"
          className={cn('px-4', range === option.value && 'bg-accent')}
          onClick={() => setRange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default DateRangePicker;
