import CategoryIcon from '@/components/icons/category-icon';
import { CategoryBar } from '@/components/ui/category-bar';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import CurrencyFlow from '@/components/vis/currency-flow';
import { getSpendingByCategory } from '@/lib/db/spending';
import { getExternalTransactions } from '@/lib/db/transaction';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import NumberFlow from '@number-flow/react';
import { transactionExternalTable } from 'afinia-common/schema';
import { format, type Interval } from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import Link from 'next/link';
import { Suspense } from 'react';

// Show change in category spend
const CategoryDelta = ({
  currentSpend,
  previousSpend,
}: {
  currentSpend: number;
  previousSpend: number;
}) => {
  // Calculate change in category spending vs previous date range
  const delta = currentSpend - previousSpend;
  const deltaPercent = delta / (previousSpend || 1);
  const textColour = delta > 0 ? 'text-red-500' : 'text-emerald-500';

  if (delta === 0 || previousSpend === 0) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 uppercase">
      <CurrencyFlow
        className={cn('text-sm font-semibold tabular-nums', textColour)}
        value={delta}
        options={{
          signDisplay: 'always',
          notation: 'compact',
        }}
      />
      <NumberFlow
        className={cn('text-sm font-semibold tabular-nums', textColour)}
        value={deltaPercent}
        format={{
          style: 'percent',
          maximumFractionDigits: 0,
          maximumSignificantDigits: 3,
          signDisplay: 'never',
          notation: 'compact',
        }}
        prefix="("
        suffix=")"
      />
    </p>
  );
};

const CategoryBreakdown = async ({
  range,
  previousRange,
}: {
  range: Interval<Date, Date>;
  previousRange: Interval<Date, Date>;
}) => {
  const [categorySpending, previousCategorySpending] = await Promise.all([
    getSpendingByCategory(range),
    getSpendingByCategory(previousRange),
  ]);
  const subCategorySpendingQuery = (category: string) =>
    getExternalTransactions({
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
      range,
      category,
    })
      .groupBy(
        transactionExternalTable.category_id,
        transactionExternalTable.category
      )
      .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
      .orderBy(sql`value`);
  const previousSpendMap = new Map(
    previousCategorySpending.map((category) => [category.id, category.value])
  );

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold">Category Breakdown</h2>
        <p className="text-muted-foreground text-sm">
          Your spending by category vs same time last month
        </p>
      </div>
      <CategoryBar
        className="h-4"
        values={categorySpending.map(({ value }) => value)}
        colors={categorySpending.map(
          ({ id }) => colours[id]?.background ?? 'bg-gray-300'
        )}
        showLabels={false}
      />
      {categorySpending.map(({ id, name, value }) => {
        const previousSpend = previousSpendMap.get(id) ?? 0;
        const isUncategorised = id === 'uncategorised';
        const href = isUncategorised
          ? `${siteConfig.baseLinks.transactions}?category=uncategorised&from=${format(
              range.start,
              'yyyy-MM-dd'
            )}&to=${format(range.end, 'yyyy-MM-dd')}`
          : `${siteConfig.baseLinks.spending}/${id}`;

        return (
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
              <Link href={href}>
                <p className="text-lg font-medium underline underline-offset-4">
                  {name}
                </p>
              </Link>
              <div className="ml-auto flex items-baseline gap-2">
                <CategoryDelta
                  currentSpend={value}
                  previousSpend={previousSpend}
                />
                <p className="text-xl font-bold">
                  {formatCurrency(value, { baseUnits: true })}
                </p>
              </div>
            </div>
            {isUncategorised ? null : (
              <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                <SpendingByCategory
                  category={id}
                  dataFetch={subCategorySpendingQuery(id)}
                />
              </Suspense>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default CategoryBreakdown;
