import CategoryIcon from '@/components/icons/category-icon';
import { CategoryBar } from '@/components/ui/category-bar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import CurrencyFlow from '@/components/vis/currency-flow';
import { getStartOfDay } from '@/lib/dateTime';
import {
  getCategorySpending,
  getSpendingByCategory,
  getSpendingByDay,
  getSpendingByMerchant,
  getSpendingTotal,
} from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import {
  addDays,
  endOfDay,
  endOfMonth,
  getDate,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import Link from 'next/link';
import { Suspense } from 'react';
import SpendingChange from './spending-change';

const SpendingOverview = async () => {
  const today = getStartOfDay();
  const currentStart = startOfMonth(today);
  const currentRange = { start: currentStart, end: endOfDay(today) };
  const previousStart = startOfMonth(subMonths(today, 1));
  const previousEnd = endOfDay(
    addDays(
      previousStart,
      Math.min(getDate(today) - 1, getDate(endOfMonth(previousStart)) - 1)
    )
  );
  const previousRange = { start: previousStart, end: previousEnd };

  const [
    total,
    previousTotal,
    days,
    categories,
    previousCategories,
    merchants,
  ] = await Promise.all([
    getSpendingTotal(currentRange),
    getSpendingTotal(previousRange),
    getSpendingByDay({ range: currentRange }),
    getSpendingByCategory(currentRange),
    getSpendingByCategory(previousRange),
    getSpendingByMerchant(currentRange),
  ]);

  const elapsedDays = days.filter(({ value }) => value !== null);
  const noSpendDays = elapsedDays.filter(({ value }) => value === 0).length;
  const change =
    previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;
  const previousByCategory = new Map(
    previousCategories.map((category) => [category.id, category])
  );
  const currentByCategory = new Map(
    categories.map((category) => [category.id, category])
  );
  const movers = [
    ...new Set([...currentByCategory.keys(), ...previousByCategory.keys()]),
  ]
    .map((id) => {
      const current = currentByCategory.get(id);
      const previous = previousByCategory.get(id);
      return {
        id,
        name: current?.name ?? previous?.name ?? id,
        delta: (current?.value ?? 0) - (previous?.value ?? 0),
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
  const topMerchantShare =
    total > 0
      ? (merchants.reduce((sum, merchant) => sum + merchant.value, 0) / total) *
        100
      : 0;

  const subCategorySpendingQuery = (category: string) =>
    getCategorySpending({
      select: {
        href: sql<string>`CONCAT('${sql.raw(
          siteConfig.baseLinks.spending
        )}/', ${transactionExternalTable.category_id})`,
        name: transactionExternalTable.category,
        value: sql<number>`abs(${sum(
          transactionExternalTable.value_in_base_units
        )})`
          .mapWith(Number)
          .as('value'),
      },
      range: currentRange,
      category,
    })
      .groupBy(
        transactionExternalTable.category_id,
        transactionExternalTable.category
      )
      .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
      .orderBy(sql`value`);

  return (
    <div className="flex flex-col gap-4">
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

      <Separator />

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Category mix</h2>
          <p className="text-muted-foreground text-sm">
            Where your money went this month
          </p>
        </div>
        <CategoryBar
          className="h-4"
          values={categories.map(({ value }) => value)}
          colors={categories.map(
            ({ id }) => colours[id]?.background ?? 'bg-gray-300'
          )}
          showLabels={false}
        />
        {categories.map(({ id, name, value }) => (
          <div className="flex flex-col gap-2" key={id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'rounded-lg p-2',
                  colours[id]?.background ?? 'bg-gray-300'
                )}
              >
                <CategoryIcon category={id} className="size-4 stroke-white" />
              </div>
              <Link href={`${siteConfig.baseLinks.spending}/${id}`}>
                <p className="text-lg font-medium underline underline-offset-4">
                  {name}
                </p>
              </Link>
              <p className="ml-auto text-xl font-bold">
                {formatCurrency(value, { baseUnits: true })}
              </p>
            </div>
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <SpendingByCategory
                category={id}
                dataFetch={subCategorySpendingQuery(id)}
              />
            </Suspense>
            <Separator className="mt-2" />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Biggest changes</h2>
          <p className="text-muted-foreground text-sm">
            Compared with the same point last month
          </p>
        </div>
        {movers.map(({ id, name, delta }) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border p-3"
          >
            <div
              className={cn(
                'rounded-lg p-2',
                colours[id]?.background ?? 'bg-gray-300'
              )}
            >
              <CategoryIcon category={id} className="size-4 stroke-white" />
            </div>
            <p className="min-w-0 flex-1 truncate font-medium">{name}</p>
            <p
              className={cn(
                'font-semibold tabular-nums',
                delta > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {delta > 0 ? '+' : '−'}
              {formatCurrency(Math.abs(delta), { baseUnits: true })}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Top merchants</h2>
            <p className="text-muted-foreground text-sm">
              {topMerchantShare.toFixed(0)}% of this month&apos;s spend
            </p>
          </div>
        </div>
        {merchants.map(({ merchant, value, transactions }) => (
          <Link
            key={merchant}
            href={`${siteConfig.baseLinks.merchants}/${encodeURIComponent(merchant)}`}
            className="flex items-center justify-between gap-3 rounded-xl border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{merchant}</p>
              <p className="text-muted-foreground text-xs">
                {transactions} transaction{transactions === 1 ? '' : 's'}
              </p>
            </div>
            <p className="font-semibold">
              {formatCurrency(value, { baseUnits: true })}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default SpendingOverview;
