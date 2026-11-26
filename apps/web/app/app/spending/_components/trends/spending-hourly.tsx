import DateRangePicker from '@/components/misc/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByHourHeatmapChart from '@/components/vis/spending/spending-by-hour-heatmap';
import { getDateRange, getStartOfDay } from '@/lib/dateTime';
import { getEarliestAccountCreatedAt } from '@/lib/db/account';
import {
  CARD_PURCHASE_TYPES,
  getSpendingByHourAndWeekday,
} from '@/lib/db/spending';
import { subYears } from 'date-fns';
import { connection } from 'next/server';
import SpendingHourlyTabs from './spending-hourly-tabs';

// Range options
const RANGE_PARAM = 'heatmap';
const RANGE_DEFAULT = '1y';
const RANGE_OPTIONS = [
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

// View options
const VIEW_PARAM = 'heatmapView';
const VIEW_DEFAULT = 'card';
const VIEW_OPTIONS = [
  { label: 'Card transactions', value: 'card' },
  { label: 'All transactions', value: 'all' },
];

const parseOption = (
  param: string | string[] | undefined,
  options: { value: string }[],
  fallback: string
) => {
  const value = Array.isArray(param) ? param[0] : param;
  return value && options.some((option) => option.value === value)
    ? value
    : fallback;
};

/**
 * Spending heatmap by day of week and hour, with view tabs and range buttons
 */
const SpendingHourly = async ({
  searchParams,
  category,
  colour,
}: {
  searchParams: Promise<{
    [RANGE_PARAM]?: string | string[];
    [VIEW_PARAM]?: string | string[];
  }>;
  category?: string;
  colour?: string;
}) => {
  await connection();
  const [params, earliest] = await Promise.all([
    searchParams,
    getEarliestAccountCreatedAt(),
  ]);
  const rangeOption = parseOption(
    params[RANGE_PARAM],
    RANGE_OPTIONS,
    RANGE_DEFAULT
  );
  const viewOption = parseOption(
    params[VIEW_PARAM],
    VIEW_OPTIONS,
    VIEW_DEFAULT
  );
  const range = getDateRange(
    rangeOption,
    earliest?.date ?? subYears(getStartOfDay(), 1)
  );
  const cardOnly = viewOption === 'card';
  const cells = await getSpendingByHourAndWeekday({
    range,
    category,
    transactionTypes: cardOnly ? CARD_PURCHASE_TYPES : undefined,
  });

  return (
    <SpendingHourlyTabs
      queryKey={VIEW_PARAM}
      defaultValue={VIEW_DEFAULT}
      options={VIEW_OPTIONS}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-full">
          <SpendingByHourHeatmapChart
            cells={cells}
            colour={colour}
            emptyMessage={
              cardOnly
                ? 'No card transactions in this period'
                : 'No spending in this period'
            }
          />
        </div>
        <DateRangePicker
          queryKey={RANGE_PARAM}
          defaultValue={RANGE_DEFAULT}
          options={RANGE_OPTIONS}
        />
      </div>
    </SpendingHourlyTabs>
  );
};

export const SpendingHourlySkeleton = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-9 w-full rounded-lg" />
    <Skeleton className="h-88 w-full" />
    <Skeleton className="h-8 w-56 self-center rounded-md" />
  </div>
);

export default SpendingHourly;
