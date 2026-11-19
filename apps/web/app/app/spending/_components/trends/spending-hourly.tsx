import DateRangePicker from '@/components/misc/date-range-picker';
import SpendingByHourHeatmapChart from '@/components/vis/spending/spending-by-hour-heatmap';
import { getDateRange, getStartOfDay } from '@/lib/dateTime';
import { getEarliestAccountCreatedAt } from '@/lib/db/account';
import { getSpendingByHourAndWeekday } from '@/lib/db/spending';
import { subYears } from 'date-fns';
import { connection } from 'next/server';

const QUERY_PARAM = 'heatmap';
const RANGE_DEFAULT = '1y';
const RANGE_OPTIONS = [
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

const parseHeatmapRange = (value?: string) =>
  value && RANGE_OPTIONS.some((option) => option.value === value)
    ? value
    : RANGE_DEFAULT;

/**
 * Spending heatmap by day of week and hour, with range buttons
 */
const SpendingHourly = async ({
  searchParams,
  category,
  colour,
}: {
  searchParams: Promise<{ [QUERY_PARAM]?: string | string[] }>;
  category?: string;
  colour?: string;
}) => {
  await connection();
  const [params, earliest] = await Promise.all([
    searchParams,
    getEarliestAccountCreatedAt(),
  ]);
  const param = params[QUERY_PARAM];
  const range = getDateRange(
    parseHeatmapRange(Array.isArray(param) ? param[0] : param),
    earliest?.date ?? subYears(getStartOfDay(), 1)
  );
  const cells = await getSpendingByHourAndWeekday({ range, category });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full">
        <SpendingByHourHeatmapChart cells={cells} colour={colour} />
      </div>
      <DateRangePicker
        queryKey={QUERY_PARAM}
        defaultValue={RANGE_DEFAULT}
        options={RANGE_OPTIONS}
      />
    </div>
  );
};

export default SpendingHourly;
