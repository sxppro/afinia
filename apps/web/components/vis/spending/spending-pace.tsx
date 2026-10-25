'use client';

import { AreaChart } from '@/components/ui/area-chart';
import { formatCurrency } from '@/lib/ui';

const SpendingPace = ({
  data,
  currentSpend,
  difference,
}: {
  data: {
    day: string;
    'This month': number | null;
    'Last month': number;
    '12-month avg': number;
  }[];
  currentSpend: number;
  // Difference between current spend and the 12-month average at the same day
  difference: number;
}) => (
  <>
    <p className="text-muted-foreground mb-2 text-sm">
      <span className="text-foreground font-medium">
        {formatCurrency(currentSpend, { baseUnits: true })}
      </span>{' '}
      spent so far,{' '}
      <span className="text-foreground font-medium">
        {formatCurrency(Math.abs(difference), { baseUnits: true })}
      </span>{' '}
      {difference > 0 ? 'beyond' : 'below'} your usual spending
    </p>
    <AreaChart
      className="h-56"
      data={data}
      index="day"
      categories={['This month', 'Last month', '12-month avg']}
      colors={['amber', 'blue', 'pink']}
      fill="none"
      showYAxis={false}
      startEndOnly
      valueFormatter={(value) => formatCurrency(value, { baseUnits: true })}
    />
  </>
);

export default SpendingPace;
