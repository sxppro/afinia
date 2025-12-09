import CategoryIcon from '@/components/category-icon';
import CurrencyFlow from '@/components/currency-flow';
import { Button } from '@/components/ui/button';
import { CategoryBar } from '@/components/ui/category-bar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import SpendingByCategory from '@/components/vis/category/spending-by-category';
import SpendingByMonth from '@/components/vis/category/spending-by-month';
import { getStartOfDay } from '@/lib/constants';
import {
  getCategorySpending,
  getCategorySpendingByTimestamp,
} from '@/lib/db/spending';
import { siteConfig } from '@/lib/siteConfig';
import { cn, colours, formatCurrency } from '@/lib/ui';
import { transactionExternalTable } from 'afinia-common/schema';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { lt, sql, sum } from 'drizzle-orm';
import { ArrowLeft, ChartColumn, Ellipsis, List } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const SpendingPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const isChartView = 'view' in params && params.view === 'chart';
  // This month
  const range = {
    start: startOfMonth(getStartOfDay()),
    end: endOfMonth(getStartOfDay()),
  };
  // Last 12 months
  const chartRange = {
    start: startOfMonth(subMonths(getStartOfDay(), 11)),
    end: endOfMonth(getStartOfDay()),
  };

  // Data fetching
  const spending = await getCategorySpending({
    select: {
      id: sql<string>`coalesce(${transactionExternalTable.category_parent_id}, 'uncategorised')`,
      name: sql<string>`coalesce(${transactionExternalTable.category_parent}, 'Uncategorised')`,
      value: sum(transactionExternalTable.value_in_base_units)
        .mapWith(Number)
        .as('value'),
    },
    range,
  })
    .groupBy(
      transactionExternalTable.category_parent_id,
      transactionExternalTable.category_parent
    )
    .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
    .orderBy(sql`value`);
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
      range,
      category,
    })
      .groupBy(
        transactionExternalTable.category_id,
        transactionExternalTable.category
      )
      .having(lt(sum(transactionExternalTable.value_in_base_units), 0))
      .orderBy(sql`value`);
  const monthlySpendingQuery = (category: string) =>
    getCategorySpendingByTimestamp({
      category,
      interval: 'month',
      range: chartRange,
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full"
            variant="outline"
            size="icon-xl"
            asChild
          >
            <Link href={siteConfig.baseLinks.appHome}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Spending</h1>
        </div>
        <div>
          <Button className="rounded-full" variant="outline" size="icon-xl">
            <Ellipsis className="size-5" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground text-lg font-medium">This month</p>
        <div className="flex items-stretch justify-between">
          <CurrencyFlow
            className="text-4xl/tight font-semibold"
            value={spending.reduce((acc, curr) => acc + curr.value, 0)}
          />
          <Button variant="outline" className="size-12 rounded-full" asChild>
            <Link
              href={
                isChartView
                  ? siteConfig.baseLinks.spending
                  : `${siteConfig.baseLinks.spending}?view=chart`
              }
            >
              {isChartView ? (
                <List className="size-6" />
              ) : (
                <ChartColumn className="size-6" />
              )}
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <CategoryBar
          className="h-4"
          values={spending.map(({ value }) => value)}
          colors={spending.map(
            ({ id }) => colours[id]?.background ?? 'bg-gray-300'
          )}
          showLabels={false}
        />
      </div>

      {spending.map(({ id, name, value }) => (
        <div className="flex flex-col gap-2" key={id}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                colours[id]?.background ?? 'bg-gray-300'
              )}
            >
              <CategoryIcon category={id} className="stroke-white size-4" />
            </div>
            <Link href={`${siteConfig.baseLinks.spending}/${id}`}>
              <p className="text-lg underline underline-offset-4 font-medium">
                {name}
              </p>
            </Link>
            <p className="text-xl font-bold ml-auto">
              {formatCurrency(value, {
                absolute: true,
                baseUnits: true,
              })}
            </p>
          </div>
          {isChartView ? (
            <Suspense>
              <SpendingByMonth
                category={id}
                dataFetch={monthlySpendingQuery(id)}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <SpendingByCategory
                category={id}
                dataFetch={subCategorySpendingQuery(id)}
              />
            </Suspense>
          )}
          <Separator className="mt-2" />
        </div>
      ))}
    </div>
  );
};

export default SpendingPage;
