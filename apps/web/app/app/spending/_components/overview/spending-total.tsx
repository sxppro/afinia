import { Separator } from '@/components/ui/separator';
import CurrencyFlow from '@/components/vis/currency-flow';
import { getSpendingByDay, getSpendingTotal } from '@/lib/db/spending';
import { formatCurrency } from '@/lib/ui';
import type { Interval } from 'date-fns';
import SpendingChange from './spending-change';

const SpendingTotal = async ({
  range,
  previousRange,
}: {
  range: Interval<Date, Date>;
  previousRange: Interval<Date, Date>;
}) => {
  const [total, previousTotal, days] = await Promise.all([
    getSpendingTotal(range),
    getSpendingTotal(previousRange),
    getSpendingByDay({ range }),
  ]);

  const elapsedDays = days.filter(({ value }) => value !== null);
  const noSpendDays = elapsedDays.filter(({ value }) => value === 0).length;
  const change =
    previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

  return (
    <>
      <section>
        <p className="text-muted-foreground text-lg font-medium">This month</p>
        <CurrencyFlow
          className="text-4xl/tight font-semibold"
          value={total}
          signDisplay="never"
        />
        <SpendingChange value={change} />
      </section>

      <Separator />

      <section className="flex gap-2">
        <div className="flex flex-1 flex-col justify-between gap-2">
          <p className="text-muted-foreground">Daily average</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(total / Math.max(elapsedDays.length, 1), {
              baseUnits: true,
            })}
          </p>
        </div>
        <Separator orientation="vertical" />
        <div className="flex flex-1 flex-col justify-between gap-2">
          <p className="text-muted-foreground">Days without spending</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-semibold">{noSpendDays}</p>
            <p className="text-muted-foreground text-sm">
              of {elapsedDays.length} days
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default SpendingTotal;
