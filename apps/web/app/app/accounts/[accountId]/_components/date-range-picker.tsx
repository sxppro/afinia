'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/ui';
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
    label: '1Y',
    value: '1y',
  },
  {
    label: 'YTD',
    value: 'ytd',
  },
  {
    label: 'ALL',
    value: 'all',
  },
];

const DateRangePicker = () => {
  const [range, setRange] = useQueryState('range', {
    defaultValue: '1m',
    shallow: false,
  });

  return (
    <ButtonGroup>
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={range === option.value ? 'secondary' : 'ghost'}
          className={cn('px-2.5', range === option.value && 'font-medium')}
          onClick={() => setRange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default DateRangePicker;
