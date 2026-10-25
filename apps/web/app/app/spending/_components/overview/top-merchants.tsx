import { getSpendingByMerchant, getSpendingTotal } from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { Interval } from 'date-fns';
import Link from 'next/link';

const TopMerchants = async ({ range }: { range: Interval<Date, Date> }) => {
  const [spendingTotal, merchants] = await Promise.all([
    getSpendingTotal(range),
    getSpendingByMerchant(range),
  ]);
  // Proportion of spending that went to top merchants
  const topMerchantPercent =
    spendingTotal > 0
      ? (merchants.reduce((sum, merchant) => sum + merchant.value, 0) /
          spendingTotal) *
        100
      : 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Top Merchants</h2>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">
              {topMerchantPercent.toFixed(0)}%
            </span>{' '}
            of this month&apos;s spend
          </p>
        </div>
      </div>
      {merchants.map(({ merchant, categoryId, value, transactions }) => (
        <div key={merchant} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                colours[categoryId]?.background ?? 'bg-up-uncategorised'
              )}
            />
            <div className="min-w-0">
              <Link
                href={`${siteConfig.baseLinks.merchants}/${encodeURIComponent(merchant)}`}
              >
                <p className="font-medium underline underline-offset-4">
                  {merchant}
                </p>
              </Link>
              <p className="text-muted-foreground text-xs">
                {transactions} transaction{transactions === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <p className="text-lg font-bold">
            {formatCurrency(value, { baseUnits: true })}
          </p>
        </div>
      ))}
    </section>
  );
};

export default TopMerchants;
